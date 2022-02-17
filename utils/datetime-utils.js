const MAX_YEAR = 2354
const MIN_YEAR = 1970

const timeUnits = {
    year: 'year',
    month: 'month',
    day: 'day',
    hour: 'hour',
    minutes: 'minutes',
    seconds: 'seconds'
}

const timePeriod = {
    future: 'future',
    past: 'past'
}

function generateRandomNumber() {
    return Math.floor(Math.random() * Math.floor(200) + 1) 
}

function getRandom(unit, max, min, year, month) {
    if (unit === timeUnits.year) {
        max = max != undefined ? max : 2354
        min = min != undefined ? min : 1970

        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    if (unit === timeUnits.month) {
        max = max != undefined ? max : 12
        min = min != undefined ? min : 1
        
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    if (unit === timeUnits.day) {
        var date = new Date(year, month, 0)
        var maxDaysInMonth = date.getDate()
        
        max = max != undefined ? max : maxDaysInMonth
        min = min != undefined ? min : 1

        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    if (unit === timeUnits.hour) {
        max = max != undefined ? max : 23
        min = min != undefined ? min : 0

        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    if (unit === timeUnits.minutes || timeUnits.seconds) {
        max = max != undefined ? max : 59
        min = min != undefined ? min : 0

        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}

function generateRandomDateTime(period = timePeriod.future) {
    let currentYear,randomYear, randomMonth, randomDay, randomHour, randomMinute, randomSecond;
    
    currentYear = new Date().getFullYear(); 
    
    if (period == timePeriod.future) {
        randomYear = getRandom(timeUnits.year, MAX_YEAR, currentYear)
        randomMonth = getRandom(timeUnits.month)
        randomDay = getRandom(timeUnits.day, undefined, undefined, randomYear, randomMonth)
        randomHour = getRandom(timeUnits.hour)
        randomMinute = getRandom(timeUnits.minutes)
        randomSecond = getRandom(timeUnits.seconds)
        return new Date(Date.UTC(randomYear, randomMonth, randomDay, randomHour, randomMinute, randomSecond))
    }

    randomYear = getRandom(timeUnits.year, currentYear - 1, MIN_YEAR)
    randomMonth = getRandom(timeUnits.month)
    randomDay = getRandom(timeUnits.day, undefined, undefined, randomYear, randomMonth)
    randomHour = getRandom(timeUnits.hour)
    randomMinute = getRandom(timeUnits.minutes)
    randomSecond = getRandom(timeUnits.seconds)

    return new Date(Date.UTC(randomYear, randomMonth, randomDay))
}

function generateRandomTimeStamp(period) {
    let dateTime = generateRandomDateTime(period)
    return Date.parse(dateTime) / 1000
}

function getMonthDifference(fromTimestamp, toTimestamp) {
    let toDate = new Date(toTimestamp * 1000)
    let fromDate = new Date(fromTimestamp * 1000)
    
    let yearDiff = (fromDate.getFullYear() - toDate.getFullYear()) * 12
    
    let fromMonth = fromDate.getMonth()
    let toMonth = toDate.getMonth()
    let monthDiff = fromMonth - toMonth
    
    return yearDiff + monthDiff
}

module.exports = {
    timeUnits,
    timePeriod,
    getRandom,
    generateRandomDateTime,
    generateRandomNumber,
    generateRandomTimeStamp,
    getMonthDifference
}