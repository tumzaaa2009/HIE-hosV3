import connection from '@/dbconfig';
const batchSize: number = 2000; // จำนวนรายการที่จะส่งในแต่ละครั้ง
import axios from 'axios';
import moment from 'moment';
import { Token_DrugAllgy, END_POINT, hospCodeEnv, hospNameEnv } from '@config';
import { connect } from 'http2';
import { resolve } from 'path';
import { promises } from 'dns';

//ยาdrugAllgy
function formatResult(queryResult) {
  const formattedResult = [];
  const groupedData = new Map();

  queryResult.forEach(row => {
    const key = `${row.cid}_${row.hospcode}`;

    if (!groupedData.has(key)) {
      groupedData.set(key, {
        cid: row.cid,
        hospcode: row.hospcode,
        drugallergy: [],
      });
    }
    const existingGroup = groupedData.get(key);
    if (!existingGroup.drugallergy.some(drug => drug.drugItemcode === row.icode)) {
      existingGroup.drugallergy.push({
        drugItemcode: row.icode,
        drugallergy: row.agent,
        drugsystom: row.drugsymptom,
      });
    }
  });

  // Convert the map to an array
  groupedData.forEach(group => {
    const uniqueDrugAllergies = new Set();
    const drugAllergyArray = group.drugallergy.reduce((result, allergy) => {
      if (!uniqueDrugAllergies.has(allergy.drugallergy)) {
        uniqueDrugAllergies.add(allergy.drugallergy);

        result.push({
          drugcode: allergy.drugItemcode,
          drugallergy: allergy.drugallergy,
          drugsystom: allergy.drugsystom,
        });
      }
      return result;
    }, []);

    formattedResult.push({
      cid: group.cid,
      hospcode: group.hospcode,
      drugallergy: drugAllergyArray,
    });
  });

  return formattedResult;
}

//ทำ visit patient
function splitDataVisit(data, chunkSize) {
  const chunks = [];

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    // แตก Object drugAllergy และกำหนดรูปแบบ
    const modifiedChunk = chunk.map(item => {
      return {
        Cid: item.cid,
        hospCode: item.hospCode,
        lastVisit: item.vstdate,
        provinceCode: item.provinceCode,
      };
    });

    chunks.push(modifiedChunk);
  }

  return chunks;
}
//สร้างชุดข้อมูลตามจำนวน //ยา
function splitDataIntoChunks(data, chunkSize) {
  const chunks = [];

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);

    //   // แตก Object drugAllergy และกำหนดรูปแบบ
    const modifiedChunk = chunk.map(item => {
      return item;
    });
    chunks.push(modifiedChunk);
  }

  return chunks;
}

async function DrugAxios(dataMap) {
  try {
    const { data, status } = await axios.post(
      `${END_POINT}/eventdrugaligy/`,
      dataMap, // Use the passed dataDrug
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': `${Token_DrugAllgy}`,
        },
      },
    );

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('error message: ', error.message);
      return error.message;
    } else {
      console.log('unexpected error: ', error);
      return 'An unexpected error occurred';
    }
  }
}
class HieService {
  public async ServiceVisitCashe(token: string): Promise<void> {
    let date = '';
    const checkVisitCaheResult = await new Promise((resolve, reject) => {
      axios
        .get(`${END_POINT}/checkvisitcashe`, {
          headers: {
            'x-api-key': `${Token_DrugAllgy}`,
            'Content-Type': 'application/json',
          },
        })
        .then(result => {
          date = result.data;
    
          if (moment(date.date).format('YYYY-MM-DD') != 'Invalid date') {
            resolve(moment(date.date).format('YYYY-MM-DD'));
          } else {
            resolve('');
          }
          // เรียก result.data เพื่อเข้าถึงข้อมูลที่รับกลับมา
        });
    });

    let maxDate = '';
    const resultQuery = await new Promise((resolve, reject) => {
      const dumpVisitListPatient: string = `SELECT
      a.cid AS cid,
      "${hospCodeEnv}" AS hospCode,
      16 AS provinceCode,
      max( a.vstdate ) AS vstdate 
      FROM
      vn_stat a 
      WHERE
      a.cid != "" 
      AND CHAR_LENGTH( a.cid ) = 13 
      AND a.cid NOT LIKE '0%' 
      AND a.vstdate <= now()
      AND a.vstdate BETWEEN '${checkVisitCaheResult}' and now()
      GROUP BY
      a.cid  `;

      connection.query(dumpVisitListPatient, (err, resQuery) => {
        if (err) {
          return resolve(err);
        }
        const originalDate = moment(resQuery[0].vstdate, 'YYYY-MM-DD');
        if (err) resolve(err);
        const previousDate = originalDate.subtract('days').format('YYYY-MM-DD');

        maxDate = previousDate;
        return resolve(resQuery);
      });
    });
    const dataChunksVisitList = await splitDataVisit(resultQuery, batchSize);
    const responsesArray = [];
    for (const chunk of dataChunksVisitList) {
      for (const item of chunk) {
        const reqbodyVisit = {
          Cid: item.Cid,
          hospCode: item.hospCode,
          lastVisit: moment(item.lastVisit).format('YYYY-MM-DD'),
          provinceCode: item.provinceCode,
        };

        try {
          const response = await axios.post(`${END_POINT}/eventvisitcashe/`, reqbodyVisit, {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': `${Token_DrugAllgy}`,
            },
          });

          responsesArray.push(response.data.msg);
        } catch (error) {
          console.log(error);
        }
      }
    }
    if (responsesArray) {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate());
      nextWeek.setHours(0, 0, 0, 0);

      // เปลี่ยนเวลาให้เป็น 23:59:00
      nextWeek.setHours(23, 59, 0, 0);
      const axiosConfig = {
        baseURL: `${END_POINT}/eventvisitcashe/`,
        headers: {
          'X-API-KEY': `${Token_DrugAllgy}`,
          'Content-Type': 'application/json',
        },
      };
      // จัดรูปแบบวันที่ในรูปแบบ "yyyy-MM-dd"
      const formattedDate = today.toISOString().slice(0, 10);
      const formattedNextWeek = nextWeek.toISOString().slice(0, 10);

      await axios.post('/', { date: maxDate, dateUpdate: formattedNextWeek + ' 23.59.00' }, axiosConfig);

      return responsesArray;
    }
  }
  // ** จบการ ทำงาน sendvisit
  public async ServiceDrugAllgyCashe(token: string, visitList: string): Promise<void> {
    try {
      let date = '';
      const checkVisitCaheResult = await new Promise((resolve, reject) => {
        axios
          .get(`${END_POINT}/checkvisitcahedrugaligy`, {
            headers: {
              'x-api-key': `${Token_DrugAllgy}`,
              'Content-Type': 'application/json',
            },
          })
          .then(result => {
            date = result.data;
            if (moment(date.date).format('YYYY-MM-DD') != 'Invalid date') {
              resolve(moment(date.date).format('YYYY-MM-DD'));
            } else {
              resolve('');
            }
            // เรียก result.data เพื่อเข้าถึงข้อมูลที่รับกลับมา
          });
      });
      let maxDate = '';
      const formattedResult = await new Promise((resolve, reject) => {
        const queryDrugAllgy: string = ` SELECT 
                                pa.cid AS cid,
                                ${hospCodeEnv} AS hospcode,
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
                                AND report_date between ${checkVisitCaheResult} and now() 
                                ORDER BY a.report_date DESC `;

        connection.query(queryDrugAllgy, (err, queryResult) => {
          const originalDate = moment(queryResult[0].update_date, 'YYYY-MM-DD');
          if (err) resolve(err);
          const previousDate = originalDate.subtract('days').format('YYYY-MM-DD');

          maxDate = previousDate;
          const formattedResult = formatResult(queryResult);
          resolve(formattedResult);
        });
      });
      const dataChunks = await splitDataIntoChunks(formattedResult, batchSize);
      let chunkResponses = [];
      //   สร้าง Promise สำหรับทุก chunk และรอจนกว่าทุกอย่างจะเสร็จสิ้น
      const responsesArray = await Promise.all(
        dataChunks.map(async chunk => {
          for (const item of chunk) {
            const reqbody = {
              Cid: item.cid,
              hospCode: item.hospcode,
              drugAllergy: item.drugallergy.map(allergy => ({
                drugcode: allergy.drugcode,
                drugallergy: allergy.drugallergy,
                drugsymptom: allergy.drugsystom,
              })),
            };

            // Use await to get the response from DrugAxios

            const response = await DrugAxios(reqbody);
            // Push the response to the chunkResponses array
            chunkResponses.push(response);
            // console.log(response);
          }
        }),
      );

      if (chunkResponses) {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate());
        nextWeek.setHours(0, 0, 0, 0);

        // เปลี่ยนเวลาให้เป็น 23:59:00
        nextWeek.setHours(23, 59, 0, 0);
        const axiosConfig = {
          baseURL: `${END_POINT}/eventdrugaligy/`,
          headers: {
            'X-API-KEY': `${Token_DrugAllgy}`,
            'Content-Type': 'application/json',
          },
        };
        // จัดรูปแบบวันที่ในรูปแบบ "yyyy-MM-dd"
        const formattedDate = today.toISOString().slice(0, 10);
        const formattedNextWeek = nextWeek.toISOString().slice(0, 10);
        await axios.post('/', { date: maxDate, dateUpdate: formattedNextWeek + ' 23.59.00' }, axiosConfig);

        return chunkResponses;
      }
    } catch (error) {
      console.error(error);
    }
  }

  public async ServiceCheckVisitTicket(ticketCheckPassCode: string): Promise<void> {
    const checkToken = await new Promise((reslove, reject) => {
      try {
        const { data, status } = axios
          .post(
            `${END_POINT}/checkticketid/`,
            { ticket: ticketCheckPassCode }, // Use the passed dataDrug
            {
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': `${Token_DrugAllgy}`,
              },
            },
          )
          .then(result => {
            return reslove(result.data);
          });
      } catch (error) {}
    });
    const checkNewDate = new Date();
    //เช็ค ticket ว่าหมดอายุรึยัง

    if (checkToken.msg.expireTicket >= moment(checkNewDate).format('YYYY-MM-DD HH:mm:ss')) {
      let visitListArray = { visit: [] };
      const callGetVisitPatient = await new Promise((resolve, reject) => {
        //  ส่งค่า listdate ชองคนไข้
        const queryText = `
                    SELECT '${hospCodeEnv}' AS hospcode
                    ,(SELECT hospital_thai_name  FROM hospital_profile)As hosname 
                    ,p.cid
                    ,p.hn
                    ,p.pname
                    ,p.fname
                    ,p.lname
                    ,(SELECT name FROM sex WHERE code=p.sex) sex
                    ,p.birthday
                    ,TIMESTAMPDIFF(YEAR,p.birthday,CURDATE()) age
              FROM patient p
              WHERE p.cid='${checkToken.msg.cidPatient}'   `;

        connection.query(queryText, (err, resQueryVisitList) => {
          if (err) {
            resolve('Query ผิดพลาด');
          } else {
            resolve({
              status: '200',
              message: 'OK',
              person: {
                hospcode: `${resQueryVisitList[0].hospcode}`,
                hospname: `${resQueryVisitList[0].hosname}`,
                cid: `${resQueryVisitList[0].cid}`,
                hn: `${resQueryVisitList[0].hn}`,
                prename: `${resQueryVisitList[0].pname}`,
                name: `${resQueryVisitList[0].fname}`,
                lname: `${resQueryVisitList[0].lname}`,
                sex: `${resQueryVisitList[0].sex}`,
                birth: `${moment(resQueryVisitList[0].birthday).format('YYYY-MM-DD')}`,
                age: `${resQueryVisitList[0].age}`,
              },
            });
          }
        });
      });

      if (callGetVisitPatient.person.cid != '') {
        const callGetVisitPatientVisitList: any = await new Promise((resolve, reject) => {
          const queryPatientVisitList: string = `
                                SELECT ov.vstdate,od.icd10 as diagcode
                                ,c1.name diagname
                                ,(SELECT name FROM   diagtype WHERE diagtype=od.diagtype) diagtype 
                                FROM patient p 
                                INNER JOIN ovst ov ON p.hn=ov.hn 
                                INNER JOIN ovstdiag od on od.vn=ov.vn
                                INNER JOIN icd101 c1 on c1.code=od.icd10
                                WHERE p.cid='${callGetVisitPatient.person.cid}'
                                ORDER BY ov.vstdate desc  `;

          connection.query(queryPatientVisitList, (err, resQueryVisitList) => {
            for (let index = 0; index < resQueryVisitList.length; index++) {
              const currentDate = moment(resQueryVisitList[index].vstdate).format('YYYY-MM-DD');
              const existingDateIndex = visitListArray.visit.findIndex(item => item.date_serv === currentDate);
              if (existingDateIndex !== -1) {
                visitListArray.visit[existingDateIndex].diag_opd.push({
                  diagtype: `${resQueryVisitList[index].diagtype}`,
                  diagcode: `${resQueryVisitList[index].diagcode}`,
                  diagname: `${resQueryVisitList[index].diagname}`,
                });
              } else {
                visitListArray.visit.push({
                  date_serv: currentDate,
                  diag_opd: [
                    {
                      diagtype: `${resQueryVisitList[index].diagtype}`,
                      diagcode: `${resQueryVisitList[index].diagcode}`,
                      diagname: `${resQueryVisitList[index].diagname}`,
                    },
                  ],
                });
              }
            }
            resolve(visitListArray);
          });
        });
        const patientWithVisits = {
          ...callGetVisitPatient,
          visit: callGetVisitPatientVisitList.visit,
        };

        return patientWithVisits;
      }
    } else {
      return { status: 400, msg: 'ticket หมดอายุ' };
    }
  }
  public async ServiceGetVisitListDate(ticketCheckPassCode: string, date_serv: string): Promise<void> {
    const checkToken = await new Promise((reslove, reject) => {
      try {
        const { data, status } = axios
          .post(
            `${END_POINT}/checkticketid/`,
            { ticket: ticketCheckPassCode }, // Use the passed dataDrug
            {
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': `${Token_DrugAllgy}`,
              },
            },
          )
          .then(result => {
            return reslove(result.data);
          });
      } catch (error) {}
    });
    const checkNewDate = new Date();

    //เช็ค ticket ว่าหมดอายุรึยัง
    if (checkToken.msg.expireTicket >= moment(checkNewDate).format('YYYY-MM-DD HH:mm:ss')) {
      const callGetVisitDate = new Promise((resolve, reject) => {
        const sql = `SELECT '${hospCodeEnv}' as hospcode, (SELECT hospital_thai_name  FROM hospital_profile)As hosname,p.cid,p.hn,p.pname,p.fname,p.lname,sex.name as sex,p.birthday,( YEAR(CURDATE()) - YEAR(p.birthday)) AS age,ov.vstdate as date_serv,
        op.temperature as btemp,op.bps as systolic,op.bpd as diastolic,op.pulse,rr as respiratory,op.height as height,op.waist as weight,op.bmi,concat(op.cc,',',op.hpi,',',p.clinic) as chiefcomp,
        ov.pdx as diagcode,icd.name as diagname ,ov.dx_doctor,dr.name as doctor,dt.name as diagtype,opi.icode,d.did,concat(d.name,' ',d.strength) as drugname,opi.qty as amount,d.units
        ,ds.code as drugusage,opr.icd9 as procedcode,icd9.name as procedname,lo.lab_items_code as labtest,li.lab_items_name as labname,lo.lab_order_result as labresult,li.lab_items_normal_value as labnormal
        from opdscreen op 
        LEFT JOIN patient p on op.hn=p.hn
        LEFT JOIN vn_stat ov on op.vn=ov.vn
        LEFT JOIN icd101 icd on ov.pdx=icd.code
        LEFT JOIN sex on sex.code=p.sex
        LEFT JOIN ovstdiag od on od.vn=ov.vn
        left join diagtype dt on dt.diagtype=od.diagtype
        left join doctor dr on dr.code =ov.dx_doctor
        left join opitemrece opi on opi.vn=op.vn
        left join drugitems d on d.icode =opi.icode
        left join drugusage ds on ds.drugusage=d.drugusage
        left join doctor_operation opr on opr.vn =op.vn 
        left join icd9cm1 icd9 on icd9.code=opr.icd9
        left join lab_head lh on lh.vn=op.vn
        left join lab_order lo on lo.lab_order_number=lh.lab_order_number
        left join lab_items li on li.lab_items_code =lo.lab_items_code
        
        where p.cid='${checkToken.msg.cidPatient}' and ov.vstdate ='${date_serv}'
        `;

        let daigOpd = { diag_opd: [] };
        let drugOpd = { drug_opd: [] };
        let procudureOpd = { procudure_opd: [] };
        let labOpd = { labfu: [] };

        connection.query(sql, (err, result) => {
          if (err) {
            console.log(err);
            reject('Query ผิดพลาด');
          } else {
            let currentDiagCode = null;
            let currentDidstd = null;
            let currentProcedCode = null;
            let curretLabsFull = null;
            for (let index = 0; index < result.length; index++) {
              // lab
              const labtest = result[index].labtest;
              if (labtest != null) {
                const existingLabsIndex = labOpd.labfu.findIndex(item => item.labtest === labtest);
                if (existingLabsIndex === -1) {
                  if (curretLabsFull === null || curretLabsFull !== labtest) {
                    labOpd.labfu.push({
                      labtest: result[index].labtest,
                      labname: result[index].labname,
                      labresult: result[index].labresult,
                      labnormal: result[index].labnormal,
                    });
                  }
                }
              }
              // diageOPd
              const icodeDiag = result[index].icode;
              if (icodeDiag != null) {
                if (currentDiagCode === null || currentDiagCode !== icodeDiag) {
                  const existingLabsIndex = daigOpd.diag_opd.findIndex(item => item.icode === icodeDiag);
                  daigOpd.diag_opd.push({
                    diagtype: result[index].diagtype,
                    diagcode: result[index].icode,
                    diagname: result[index].diagname,
                  });
                }
              }
              // หัตถการ
              const procedcode = result[index].procedcode;
              if (procedcode != null) {
                if (currentProcedCode === null || currentProcedCode !== procedcode) {
                  const existingProcedIndex = procudureOpd.procudure_opd.findIndex(item => item.procedcode === procedcode);
                 
                  if (existingProcedIndex === -1) {
                    procudureOpd.procudure_opd.push({
                      procedcode: procedcode,
                      procedname: result[index].procedname,
                    });
                  }
                }
              }
              // รายการยา
              const did = result[index].did;
              if (did != null) {
                if (currentDidstd === null || currentDidstd !== did) {
                  currentDidstd = did;
                  const existingDidIndex = drugOpd.drug_opd.findIndex(item => item.didstd === did);
                  if (existingDidIndex === -1) {
                    drugOpd.drug_opd.push({
                      didstd: did,
                      drugname: result[index].drugname,
                      amount: result[index].amount,
                      unit: result[index].units,
                      usage: result[index].drugusage,
                    });
                  }
                }
              }
            }

            const getDatePatient: any = {
              status: '200',
              message: 'OK',
              person: {
                hospcode: result[0].hospcode,
                hospname: result[0].hosname,
                cid: result[0].cid,
                hn: result[0].hn,
                prename: result[0].pname,
                name: result[0].fname,
                lname: result[0].lname,
                sex: result[0].sex,
                birth: moment(result[0].birthday).format('YYYY-MM-DD'),
                age: result[0].age,
              },
              visit: {
                date_serv: moment(result[0].date_serv).format('YYYY-MM-DD'),
                btemp: result[0].btemp,
                systolic: result[0].systolic,
                diastolic: result[0].diastolic,
                pulse: result[0].pulse,
                respiratory: result[0].respiratory,
                height: result[0].height,
                weight: result[0].weight,
                bmi: result[0].bmi,
                chiefcomp: result[0].chiefcomp,
                doctor: result[0].doctor,
                diag_opd: daigOpd.diag_opd,
                drug_opd: drugOpd.drug_opd,
                procudure_opd: procudureOpd.procudure_opd,
                labfu: labOpd.labfu,
              },
            };

            resolve(getDatePatient);
          }
        });
      });

      return callGetVisitDate;
    } else {
      return { status: 400, msg: 'ticket หมดอายุ' };
    }
  }
}

export default HieService;
