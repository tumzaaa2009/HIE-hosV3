1.ส่ง dump visit ตาม query  -> SELECT
      a.cid AS cid,
      10864 AS hospCode, # แก้ไขรหัส รพ
      26 AS provinceCode,  # แก้ไขรหัสจังหวัด 
      max( a.vstdate ) AS vstdate 
      FROM
      vn_stat a 
      WHERE
      a.cid != "" 
      AND CHAR_LENGTH( a.cid ) = 13 
      AND a.cid NOT LIKE '0%' 
      AND a.vstdate <= now()
    
      GROUP BY
      a.cid 
      ORDER BY a.vstdate DESC
ส่งเป็น text file ->formatt date yyyy-mm-dd , เอาหัวมาด้วย  
ส่งให้ admin rh4

2. ตาราง แพ้ ยา  ขอค่า vst date บนสุด
	SELECT 
                                pa.cid AS cid,
                             
                                DATE(a.report_date) AS update_date,
                                a.agent AS agent,
                                a.agent_code24 AS icode,
                                a.symptom AS drugsymptom
                                FROM opd_allergy a
                                LEFT JOIN patient pa ON pa.hn = a.hn
                                LEFT JOIN drugitems aitem ON aitem.name = a.agent
                                WHERE pa.cid != '' 
                                AND LENGTH(pa.cid) = 13
                                AND pa.cid NOT LIKE '0%'
                                AND report_date IS NOT NULL
                             
                                ORDER BY a.report_date ASC

3.การลงทะเบียน ของเขต 
  3.1 รหัสหน่วยบริการ 
 3.2 email เพื่อส่ง token ตอบกลับ
 
4.เมื่อทางเขต ลงทะเบียนให้เรียบร้อยแล้ว ให้ แก้ ไข ไฟล์ ใน .env.production แก้ไข ชื่อ รพ รหัสจังหวัด db , และ  tokendrug  ##กรณี ถ้ามี cert สามารถ ย้าย ตำแหน่ง patch ทางวาง cert ได้เลย กรณีที่ยังไม่มี domain แจ้งทาง admin ให้ admin map ให้

5. เข้า terminal ชี้ patch ไปที่ hie ใช้คำสั่ง npm run dev เพื่อ ทดสอบว่า node วิ่งไหม ถ้า วิ่ง กด ctl+c และพิมพ์คำสั่ง deploy --> npm run deploy:prod
			
