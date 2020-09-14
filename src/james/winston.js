const winston = require('winston');

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message,  timestamp }) => {
    return `${new Date(timestamp).toLocaleString()} ${level}: ${JSON.stringify(message)}`;
  });

  const logger = createLogger({
    format: combine(      
      timestamp(),
      myFormat
    ),
    transports: [new winston.transports.File({ filename: 'error.log' })]    
  });



  function log_error(msg){
    logger.log({
      level: 'error',
      message: msg
    });
  }
  
  module.exports = log_error;