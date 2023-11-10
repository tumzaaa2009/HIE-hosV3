const axios = require('axios');
const moment = require('moment');
const https = require('https')
const { config } = require('dotenv');
config({ path: '.env.production.local' });
const cron = require('node-cron');
const { END_POINT, URL_Hos, Token_DrugAllgy } = process.env;

const checkAndRun = async () => {
  try {
    const response = await axios.get(`${END_POINT}/checkvisitcashe/`, {
      headers: {
        'x-api-key': Token_DrugAllgy
      }
    });
    
    const dateEvent = response.data.dateEvent;
   
    if ( moment().format("YYYY-MM-DD HH:mm:ss") >= dateEvent) {
      console.log("tsss")
      try {
        await axios.post(`${URL_Hos}/hie/visitcashe`,null, {
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        });
        console.log('HTTP request to ' + URL_Hos + '/hie/visitcashe has been made.');
        // เพิ่มโค้ดเพิ่มเติมที่คุณต้องการจากการเรียก HTTP นี้
      } catch (error) {
        console.error('HTTP request to ' + URL_Hos + '/hie/visitcashe failed:', error);
      }
    } else {
      console.log('Not yet time to make the HTTP request.');
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
    
  

};

// เรียกฟังก์ชัน checkAndRun เพื่อเริ่มต้นตรวจสอบและการรัน
cron.schedule('52 10 * * *', () => {
  console.log('Running checkAndRun at 11:30 AM every day');
  checkAndRun();
});