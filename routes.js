const util = require('./util')
const ObjectID = require('mongodb').ObjectID;
const { isDigit, isEmptyString, isEmptyObj, handleErrorRes, getRandomDigit } = util;

module.exports = function(app, db) {
 
    app.get('/getCouseTitle', (req, res) => {
        const { year, deptId } = req.query;
        let query = {}

        if (isDigit(year))
            query.year = Number(year)

        if (!isEmptyString(deptId))
            query.deptId = deptId

        db.collection('course').find(query, { projection : {title: 1}}).toArray((err, result)  => {
            if (err) {
                return handleErrorRes(res, [err])
            } 
            res.json(result);
        });
    });

    app.get('/getCouseInfo', (req, res) => {
        const { year, deptId } = req.query;
        let query = {}

        if (util.isDigit(year))
            query.year = Number(year)

        if (!isEmptyString(deptId))
            query.deptId = deptId

        db.collection('course').find(query).toArray((err, result)  => {
            if (err) {
                return handleErrorRes(res, [err])
            } 
            res.json(result);
        });
    });

    app.get('/getCourseInfoSortedByPop', (req, res) => {
        const { year, deptId } = req.query;
        let query = {}

        if (util.isDigit(year))
        query.year = Number(year)

        if (!isEmptyString(deptId))
        query.deptId = deptId

        db.collection('course').aggregate([
            {
                $match : query
            },
            {
                $project: {
                    title: 1,
                    level: 1,
                    deptId: 1,
                    year: 1,
                    classSize: 1,
                    enrolled: 1,
                    enrolled_count: {$size: "$enrolled"},
                }
            },
            {
                $sort: {"enrolled_count": -1}
            }
        ]).toArray( (err, result) => {
            if (err) {
                return handleErrorRes(res, [err])
            }
            res.send(result);
        })
    });

    app.get('/getEnrolledStudent', (req, res) => {
        const { year, deptId } = req.query;
        let query = {}
        let errMsg = [];

        if (util.isDigit(year))
            query.year = Number(year)
        else 
            errMsg.push('Invalid year');

        if (!isEmptyString(deptId))
            query.deptId = deptId
        else 
            errMsg.push('Invalid department ID');

        if (!isEmptyObj(errMsg))
            return handleErrorRes(res, errMsg)

        db.collection('course').find(query, { projection: {"enrolled.stuName": 1, _id: 0}}).toArray((err, result)  => {
            if (err) {
                return handleErrorRes(res, [err])
            } 
            res.json(result);
        });
    });

    app.get('/getEnrolledCourse', (req, res) => {
        const { year, deptId, stuId } = req.query;
        let query = {}

        if (util.isDigit(year))
            query.year = Number(year)

        if (!isEmptyString(deptId))
            query.deptId = deptId

        if (!isEmptyString(stuId)) {
            query["enrolled.stuId"] = stuId
        } 

        console.log(query)

        db.collection('course').find(query).toArray((err, result)  => {
            if (err) {
                return handleErrorRes(res, [err])
            } 
            res.json(result);
        });
    });

    app.post('/enrollCourse', (req, res) => {
        const { courseId, stuId } = req.query;
        let query4FindCourse = {}
        let query4FindStudent = {}
        let query4Upt = {}
        let errMsg = []

        if (!isEmptyString(courseId)) {
            query4Upt._id = new ObjectID(courseId)
            query4FindCourse._id = new ObjectID(courseId)
        }  else {
            errMsg.push('Invalid course ID');
        }
    
        if (!isEmptyString(stuId)) {
            query4FindStudent._id = new ObjectID(stuId)
            query4Upt.enrolled = {$ne: stuId}
        } else {
            errMsg.push('Invalid student ID');
        }
            
        if (!isEmptyObj(errMsg))
            return handleErrorRes(res, errMsg)

        db.collection('student').findOne(query4FindStudent, (err, student) => {
            if (err) {
                return handleErrorRes(res, [err])
            } 

            if (!isEmptyObj(student)) {
                let enrolled = {}
                enrolled.stuId = stuId
                enrolled.stuName = student.stuName
                enrolled.enrolledDate = new Date()
                return db.collection('course').updateOne(query4Upt, {$push: {enrolled} }, (err) => {
                    if (err) {
                        return handleErrorRes(res, [err])
                    }
                    return db.collection('course').findOne(query4FindCourse, (err, course)  => {
                        if (err) {
                            return handleErrorRes(res, [err])
                        }
                        res.json({
                            status: true,
                            result: course,
                        });
                    });
                });
            } else {
                return handleErrorRes(res, ['Enroll operation failed.'])
            }
        })           
    });

    app.get('/getDepartment', (req, res) => {
        db.collection('department').find({}).toArray( (err, result) => {
            if (err) {
                return handleErrorRes(res, [err])
            }
            res.json(result)
        })
    })

    app.post('/unenrollCourse', (req, res) => {
        const { courseId, stuId } = req.query;
        let query4FindCourse = {}
        let query4FindStudent = {}
        let query4Upt = {}
        let errMsg = []

        if (!isEmptyString(courseId)) {
            query4Upt._id = new ObjectID(courseId)
            query4FindCourse._id = new ObjectID(courseId)
        }  else {
            errMsg.push('Invalid course ID');
        }
    
        if (!isEmptyString(stuId)) {
            query4FindStudent._id = new ObjectID(stuId)
            query4Upt.enrolled = {$ne: stuId}
        } else {
            errMsg.push('Invalid student ID');
        }
            
        if (!isEmptyObj(errMsg))
            return handleErrorRes(res, errMsg)

        db.collection('student').findOne(query4FindStudent, (err, student) => {
            if (err) {
                return handleErrorRes(res, [err])
            } 
            if (!isEmptyObj(student)) {
                return db.collection('course').updateOne(query4Upt, {$pull: {enrolled: {stuId}}}, (err) => {
                    if (err) {
                        return handleErrorRes(res, [err])
                    }
                    return db.collection('course').findOne(query4FindCourse, (err, course)  => {
                        if (err) {
                            return handleErrorRes(res, [err])
                        }
                        res.json({
                            status: true,
                            result: course,
                        });
                    });
                });
            } else {
                return handleErrorRes(res, ['Enroll operation failed.'])
            }
        })         
    });

    app.get('/getStudent', (req, res) => {
        let query = {}
        const { name } = req.query;
        
        if (!isEmptyString(name)) 
            query = { $text: {
                        $search: name,
                    }
                }

        db.collection('student').find(query).toArray( (err, result) => {
            if (err) {
                return handleErrorRes(res, [err])
            }
            res.json(result)
        })  
    })

    app.post('/addDummyStudent', (req, res) => {
        const firstNames = ['Chan', 'Wong', 'Cheng', 'Chau', 'Man', 'Tang', 'Lee', 'Yip', 'Law', 'Ip']
        const surName = ['Tom', 'May', 'Mary', 'Peter', 'Tommy', 'Chris', 'Christine', 'Arien', 'Sam', 'David']
        async function getDummyData() {
            let dataList = [];
            for (let i=0; i<40; i++) {
                let data = {}
                data.stuName = surName[getRandomDigit(9)] + ' ' + firstNames[getRandomDigit(9)]
                let date = new Date();
                date.setFullYear(2019 - 18 - getRandomDigit(4))
                date.setDate(getRandomDigit(30) + 1)
                date.setMonth(getRandomDigit(12) + 1)
                data.dob = date
                data.courseId = []
                dataList.push(data)
            }
            return dataList;
        }
        getDummyData().then( data => {
            console.log(data)
            db.collection('student').insertMany(data, (err, result) => {
                if (err) {
                    return handleErrorRes(res, [err])
                }
                res.json({status: true})
            })
        })
    });
   
    return app;
  }
