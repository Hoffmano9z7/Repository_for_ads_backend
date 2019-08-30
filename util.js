module.exports = {
    isDigit: function (s) {
        let isValid = false;
        if (!!s)
            isValid = /^[0-9]+$/.test(s)
        return isValid
    },
    isEmptyString: function (s) {
        let isValid = false;
        if (s === null || s === undefined || s === "")
            isValid = true;
        return isValid;
    },
    isEmptyObj: function (obj) {
        if (typeof obj === "undefined") return true;
        if (obj == null) return true;
        if (obj.length > 0)    return false;
        if (obj.length === 0)  return true;
        if (typeof obj !== "object") return true;
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) return false;
        }
        return true;
    },
    handleErrorRes: function (res, err) {
        console.table(err)
        return res.json({
            status: false,
            err
        })
    },
    getRandomDigit: function (max) {
        return Math.floor((Math.random() * (max + 1)));
    },
}

