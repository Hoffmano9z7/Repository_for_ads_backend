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

        if (!isEmptyObj(deptId))
            query.deptId = {$in : deptId}
        
        db.collection('course').find(query).toArray((err, course) => {
            if (err) {
                return handleErrorRes(res, [err])
            } 
            db.collection('department').find({}).toArray( (err, dept) => {
                if (err) {
                    return handleErrorRes(res, [err])
                }
                const result = course.map( data => {
                    data['department'] = data.deptId.map( id => {
                        return dept.find(elem => elem._id == id)
                    })
                    return data;
                })
                res.json(result)
            })
        });
    });

    app.get('/getCourseInfoSortedByPop', (req, res) => {
        const { year, deptId } = req.query;
        let query = {}

        if (util.isDigit(year))
            query.year = Number(year)

        if (!isEmptyObj(deptId))
            query.deptId = {$in : deptId}

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
        ]).toArray( (err, course) => {
            if (err) {
                return handleErrorRes(res, [err])
            }
            db.collection('department').find({}).toArray( (err, dept) => {
                if (err) {
                    return handleErrorRes(res, [err])
                }
                const result = course.map( data => {
                    data['department'] = data.deptId.map( id => {
                        return dept.find(elem => elem._id == id)
                    })
                    return data;
                })
                res.json(result)
            })
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
        } else {
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
            db.collection('student').insertMany(data, (err, result) => {
                if (err) {
                    return handleErrorRes(res, [err])
                }
                res.json({status: true})
            })
        })
    });

    app.post('/addStudent', (req, res) => {
        let query = {}
        const { stuName, dob } = req.query;
        let errMsg = []
        
        if (!isEmptyString(stuName)) 
            query.stuName = stuName
        else 
            errMsg.push('Invalid Student Name');

        if (!isEmptyString(dob))
            query.dob = new Date(dob)
        else 
            errMsg.push('Invalid Date of Birth');

        if (!isEmptyObj(errMsg))
            return handleErrorRes(res, errMsg)

        query.course = []

        db.collection('student').insertOne(query, (err, result) => {
            if (err) {
                return handleErrorRes(res, [err])
            }
            res.json({status: true, id: result.insertedId})
        })
    });

    app.post('/delStudent', (req, res) => {
        let query = {}
        const { id } = req.query;
        let errMsg = []
        
        if (!isEmptyString(id)) 
            query._id = new ObjectID(id)
        else 
            errMsg.push('Invalid Student');

        if (!isEmptyObj(errMsg))
            return handleErrorRes(res, errMsg)

        db.collection('student').deleteOne(query, err => {
            if (err) {
                return handleErrorRes(res, [err])
            }
            res.json({status: true});
        })
    });

    app.post('/updateStudent', (req, res) => {
        let selQuery = {}
        let updateQuery = {}
        const { id, stuName, dob } = req.query;
        let errMsg = []
        
        if (!isEmptyString(id)) 
            selQuery._id = new ObjectID(id)
        else 
            errMsg.push('Update failed due to invalid ID');
        
        if (!isEmptyString(stuName)) 
            updateQuery.stuName = stuName

        if (!isEmptyString(dob)) 
            updateQuery.dob = new Date(dob)

        if (!isEmptyObj(errMsg))
            return handleErrorRes(res, errMsg)

        db.collection('student').updateOne(selQuery, {$set:updateQuery}, err => {
            if (err) {
                return handleErrorRes(res, [err])
            }
            res.json({status: true});
        })
    });

    app.post('/addDept', (req, res) => {
        let query = {}
        const { deptName, location } = req.query;
        let errMsg = []
        
        if (!isEmptyString(deptName)) 
            query.deptName = deptName
        else 
            errMsg.push('Invalid Department Name');

        if (!isEmptyString(location))
            query.location = location
        else 
            errMsg.push('Invalid Location');

        if (!isEmptyObj(errMsg))
            return handleErrorRes(res, errMsg)

        db.collection('department').insertOne(query, (err, result) => {
            if (err) {
                return handleErrorRes(res, [err])
            }
            res.json({status: true, id: result.insertedId})
        })
    });

    app.post('/delDept', (req, res) => {
        let query = {}
        const { id } = req.query;
        let errMsg = []
        
        if (!isEmptyString(id)) 
            query._id = new ObjectID(id)
        else 
            errMsg.push('Invalid Department');

        if (!isEmptyObj(errMsg))
            return handleErrorRes(res, errMsg)

        db.collection('department').deleteOne(query, err => {
            if (err) {
                return handleErrorRes(res, [err])
            }
            res.json({status: true});
        })
    });

    app.post('/updateDept', (req, res) => {
        let selQuery = {}
        let updateQuery = {}
        const { id, deptName, location } = req.query;
        let errMsg = []
        
        if (!isEmptyString(id)) 
            selQuery._id = new ObjectID(id)
        else 
            errMsg.push('Update failed due to invalid ID');
        
        if (!isEmptyString(deptName)) 
            updateQuery.deptName = deptName

        if (!isEmptyString(location)) 
            updateQuery.location = location

        if (!isEmptyObj(errMsg))
            return handleErrorRes(res, errMsg)

        db.collection('department').updateOne(selQuery, {$set:updateQuery}, err => {
            if (err) {
                return handleErrorRes(res, [err])
            }
            res.json({status: true});
        })
    });

    app.post('/addCourse', (req, res) => {
        let query = {}
        const { title, level, deptId, year, classSize } = req.query;
        let errMsg = []

        if (!isEmptyString(title)) 
            query.title = title
        else 
            errMsg.push('Invalid Course Ttile');

        if (!isEmptyString(level))
            query.level = level
        else 
            errMsg.push('Invalid Level');

        if (!isEmptyString(year))
            query.year = year
        else 
            errMsg.push('Invalid year');

        if (!isEmptyString(classSize))
            query.classSize = classSize
        else 
            errMsg.push('Invalid Class Size');

        if (!isEmptyObj(deptId))
            query.deptId = deptId;
        else 
            errMsg.push('Invalid Department');

        if (!isEmptyObj(errMsg))
            return handleErrorRes(res, errMsg)

        query.enrolled = [];

        db.collection('course').insertOne(query, (err, result) => {
            if (err) {
                return handleErrorRes(res, [err])
            }
            res.json({status: true, id: result.insertedId})
        })
    });

    app.post('/delCourse', (req, res) => {
        let query = {}
        const { id } = req.query;
        let errMsg = []
        
        if (!isEmptyString(id)) 
            query._id = new ObjectID(id)
        else 
            errMsg.push('Invalid Course');

        if (!isEmptyObj(errMsg))
            return handleErrorRes(res, errMsg)

        db.collection('course').deleteOne(query, err => {
            if (err) {
                return handleErrorRes(res, [err])
            }
            res.json({status: true});
        })
    });

    
    app.post('/updateCourse', (req, res) => {
        let selQuery = {}
        let updateQuery = {}
        const { id, title, level, deptId, year, classSize } = req.query;
        let errMsg = []
        
        if (!isEmptyString(id)) 
            selQuery._id = new ObjectID(id)
        else 
            errMsg.push('Update failed due to invalid ID');
        
        if (!isEmptyString(title)) 
            updateQuery.title = title

        if (!isEmptyString(level)) 
            updateQuery.level = level
        
        if (!isEmptyString(year)) 
            updateQuery.year = year
        
        if (!isEmptyString(deptId)) 
            updateQuery.deptId = deptId

        if (!isEmptyString(classSize)) 
            updateQuery.classSize = classSize

        if (!isEmptyObj(errMsg))
            return handleErrorRes(res, errMsg)

        db.collection('course').updateOne(selQuery, {$set:updateQuery}, err => {
            if (err) {
                return handleErrorRes(res, [err])
            }
            res.json({status: true});
        })
    });
   
    return app;
  }
