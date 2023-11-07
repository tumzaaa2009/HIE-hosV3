ให้เจ้าหน้าที่แจ้ง เจ้าหน้าที่ เขต เพื่อลง ทะเบียน เพื่อรับ token และ ทราบ endpoint เพื่อดึงข้อมูล

env.prodution ปรับตัวแปร ต่างๆตรงนี้ 
เมื่อตั้งค่าเสร็จ
กรณีที่ พอร์ต 80 ว่าง ใช้ docker รันได้เลย กรณีมี domanin แต่ไม่มี ssl
กรณีใช้ พอร์ต 3000 มี ssl domanin แล้ว ให้ไป ใส่ ที่อยู่ ssl ที่ ecosystem.config file และ ใช้คำสั่งรัน npm run deploy:prod
ทำ crontab เพื่อดึง lastvisit  ครั้งแรก ให้หน่วยบริการ dump text ของ last vist  (มีหัว coloumn และ comma dateformatt ->"YYYY-MM-DD" ) 
แพ้ยา ให้หน่วยบริการ หาค่า min ที่มารับบริการรับยา ส่งให้เขต เซต วันที่ ๆจะไล่ดึงข้อมูล
เรียกคำสั่ง npm run pm2-cron
