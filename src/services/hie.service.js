"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var dbconfig_1 = require("@/dbconfig");
var batchSize = 2000; // จำนวนรายการที่จะส่งในแต่ละครั้ง
var axios_1 = require("axios");
var moment_1 = require("moment");
var _config_1 = require("@config");
console.log(_config_1.Token_DrugAllgy);
//ยาdrugAllgy
function formatResult(queryResult) {
    var formattedResult = [];
    var groupedData = new Map();
    queryResult.forEach(function (row) {
        var key = "".concat(row.cid, "_").concat(row.hospcode);
        if (!groupedData.has(key)) {
            groupedData.set(key, {
                cid: row.cid,
                hospcode: row.hospcode,
                drugallergy: [],
            });
        }
        var existingGroup = groupedData.get(key);
        if (!existingGroup.drugallergy.some(function (drug) { return drug.drugItemcode === row.icode; })) {
            existingGroup.drugallergy.push({
                drugItemcode: row.icode,
                drugallergy: row.agent,
                drugsystom: row.drugsymptom,
            });
        }
    });
    // Convert the map to an array
    groupedData.forEach(function (group) {
        var uniqueDrugAllergies = new Set();
        var drugAllergyArray = group.drugallergy.reduce(function (result, allergy) {
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
    var chunks = [];
    for (var i = 0; i < data.length; i += chunkSize) {
        var chunk = data.slice(i, i + chunkSize);
        // แตก Object drugAllergy และกำหนดรูปแบบ
        var modifiedChunk = chunk.map(function (item) {
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
    var chunks = [];
    for (var i = 0; i < data.length; i += chunkSize) {
        var chunk = data.slice(i, i + chunkSize);
        //   // แตก Object drugAllergy และกำหนดรูปแบบ
        var modifiedChunk = chunk.map(function (item) {
            return item;
        });
        chunks.push(modifiedChunk);
    }
    return chunks;
}
function DrugAxios(dataMap) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, status_1, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.post("".concat(_config_1.END_POINT, "/eventdrugaligy/"), dataMap, // Use the passed dataDrug
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'x-api-key': "".concat(_config_1.Token_DrugAllgy),
                            },
                        })];
                case 1:
                    _a = _b.sent(), data = _a.data, status_1 = _a.status;
                    console.log(dataMap);
                    return [2 /*return*/, data];
                case 2:
                    error_1 = _b.sent();
                    if (axios_1.default.isAxiosError(error_1)) {
                        console.log('error message: ', error_1.message);
                        return [2 /*return*/, error_1.message];
                    }
                    else {
                        console.log('unexpected error: ', error_1);
                        return [2 /*return*/, 'An unexpected error occurred'];
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
var HieService = /** @class */ (function () {
    function HieService() {
    }
    HieService.prototype.ServiceVisitCashe = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var date, checkVisitCaheResult, maxDate, resultQuery, dataChunksVisitList, responsesArray, _i, dataChunksVisitList_1, chunk, _a, chunk_1, item, reqbodyVisit, response, error_2, today, nextWeek, axiosConfig, formattedDate, formattedNextWeek;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        date = '';
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                axios_1.default
                                    .get("".concat(_config_1.END_POINT, "/checkvisitcashe"), {
                                    headers: {
                                        'x-api-key': "".concat(_config_1.Token_DrugAllgy),
                                        'Content-Type': 'application/json',
                                    },
                                })
                                    .then(function (result) {
                                    date = result.data;
                                    console.log(result.data);
                                    if ((0, moment_1.default)(date.date).format('YYYY-MM-DD') != 'Invalid date') {
                                        resolve((0, moment_1.default)(date.date).format('YYYY-MM-DD'));
                                    }
                                    else {
                                        resolve('');
                                    }
                                    // เรียก result.data เพื่อเข้าถึงข้อมูลที่รับกลับมา
                                });
                            })];
                    case 1:
                        checkVisitCaheResult = _b.sent();
                        maxDate = '';
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var dumpVisitListPatient = "SELECT\n      a.cid AS cid,\n      \"10691\" AS hospCode,\n      16 AS provinceCode,\n      max( a.vstdate ) AS vstdate \n      FROM\n      vn_stat a \n      WHERE\n      a.cid != \"\" \n      AND CHAR_LENGTH( a.cid ) = 13 \n      AND a.cid NOT LIKE '0%' \n      AND a.vstdate <= now()\n      AND a.vstdate BETWEEN '".concat(checkVisitCaheResult, "' and now()\n      GROUP BY\n      a.cid limit 1 ");
                                dbconfig_1.default.query(dumpVisitListPatient, function (err, resQuery) {
                                    if (err) {
                                        return resolve(err);
                                    }
                                    var originalDate = (0, moment_1.default)(resQuery[0].vstdate, 'YYYY-MM-DD');
                                    if (err)
                                        resolve(err);
                                    var previousDate = originalDate.subtract('days').format('YYYY-MM-DD');
                                    maxDate = previousDate;
                                    return resolve(resQuery);
                                });
                            })];
                    case 2:
                        resultQuery = _b.sent();
                        return [4 /*yield*/, splitDataVisit(resultQuery, batchSize)];
                    case 3:
                        dataChunksVisitList = _b.sent();
                        responsesArray = [];
                        _i = 0, dataChunksVisitList_1 = dataChunksVisitList;
                        _b.label = 4;
                    case 4:
                        if (!(_i < dataChunksVisitList_1.length)) return [3 /*break*/, 11];
                        chunk = dataChunksVisitList_1[_i];
                        _a = 0, chunk_1 = chunk;
                        _b.label = 5;
                    case 5:
                        if (!(_a < chunk_1.length)) return [3 /*break*/, 10];
                        item = chunk_1[_a];
                        reqbodyVisit = {
                            Cid: item.Cid,
                            hospCode: item.hospCode,
                            lastVisit: (0, moment_1.default)(item.lastVisit).format('YYYY-MM-DD'),
                            provinceCode: item.provinceCode,
                        };
                        _b.label = 6;
                    case 6:
                        _b.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, axios_1.default.post("".concat(_config_1.END_POINT, "/eventvisitcashe/"), reqbodyVisit, {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'x-api-key': "".concat(_config_1.Token_DrugAllgy),
                                },
                            })];
                    case 7:
                        response = _b.sent();
                        console.log(response.data.msg); // แสดงค่า response.data.msg
                        responsesArray.push(response.data.msg);
                        return [3 /*break*/, 9];
                    case 8:
                        error_2 = _b.sent();
                        console.log(error_2);
                        return [3 /*break*/, 9];
                    case 9:
                        _a++;
                        return [3 /*break*/, 5];
                    case 10:
                        _i++;
                        return [3 /*break*/, 4];
                    case 11:
                        if (!responsesArray) return [3 /*break*/, 13];
                        today = new Date();
                        nextWeek = new Date(today);
                        nextWeek.setDate(today.getDate());
                        nextWeek.setHours(0, 0, 0, 0);
                        // เปลี่ยนเวลาให้เป็น 23:59:00
                        nextWeek.setHours(23, 59, 0, 0);
                        axiosConfig = {
                            baseURL: "".concat(_config_1.END_POINT, "/eventvisitcashe/"),
                            headers: {
                                'X-API-KEY': "".concat(_config_1.Token_DrugAllgy),
                                'Content-Type': 'application/json',
                            },
                        };
                        formattedDate = today.toISOString().slice(0, 10);
                        formattedNextWeek = nextWeek.toISOString().slice(0, 10);
                        return [4 /*yield*/, axios_1.default.post('/', { date: maxDate, dateUpdate: formattedNextWeek + ' 23.59.00' }, axiosConfig)];
                    case 12:
                        _b.sent();
                        return [2 /*return*/, responsesArray];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    // ** จบการ ทำงาน sendvisit
    HieService.prototype.ServiceDrugAllgyCashe = function (token, visitList) {
        return __awaiter(this, void 0, void 0, function () {
            var date_1, checkVisitCaheResult_1, maxDate_1, formattedResult, dataChunks, chunkResponses_1, responsesArray, today, nextWeek, axiosConfig, formattedDate, formattedNextWeek, error_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        date_1 = '';
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                axios_1.default
                                    .get("".concat(_config_1.END_POINT, "/checkvisitcahedrugaligy"), {
                                    headers: {
                                        'x-api-key': "".concat(_config_1.Token_DrugAllgy),
                                        'Content-Type': 'application/json',
                                    },
                                })
                                    .then(function (result) {
                                    date_1 = result.data;
                                    if ((0, moment_1.default)(date_1.date).format('YYYY-MM-DD') != 'Invalid date') {
                                        resolve((0, moment_1.default)(date_1.date).format('YYYY-MM-DD'));
                                    }
                                    else {
                                        resolve('');
                                    }
                                    // เรียก result.data เพื่อเข้าถึงข้อมูลที่รับกลับมา
                                });
                            })];
                    case 1:
                        checkVisitCaheResult_1 = _a.sent();
                        maxDate_1 = '';
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var queryDrugAllgy = " SELECT \n                                pa.cid AS cid,\n                                10691 AS hospcode,\n                                DATE(a.report_date) AS update_date,\n                                a.agent AS agent,\n                                a.agent_code24 AS icode,\n                                a.symptom AS drugsymptom\n                                FROM opd_allergy a\n                                LEFT JOIN patient pa ON pa.hn = a.hn\n                                LEFT JOIN drugitems aitem ON aitem.name = a.agent\n                                WHERE pa.cid != '' \n                                AND LENGTH(pa.cid) = 13\n                                AND pa.cid NOT LIKE '0%'\n                                AND report_date IS NOT NULL\n                                AND report_date between ".concat(checkVisitCaheResult_1, " and now() \n                                ORDER BY a.report_date DESC ");
                                dbconfig_1.default.query(queryDrugAllgy, function (err, queryResult) {
                                    var originalDate = (0, moment_1.default)(queryResult[0].update_date, 'YYYY-MM-DD');
                                    if (err)
                                        resolve(err);
                                    var previousDate = originalDate.subtract('days').format('YYYY-MM-DD');
                                    maxDate_1 = previousDate;
                                    var formattedResult = formatResult(queryResult);
                                    resolve(formattedResult);
                                });
                            })];
                    case 2:
                        formattedResult = _a.sent();
                        return [4 /*yield*/, splitDataIntoChunks(formattedResult, batchSize)];
                    case 3:
                        dataChunks = _a.sent();
                        chunkResponses_1 = [];
                        return [4 /*yield*/, Promise.all(dataChunks.map(function (chunk) { return __awaiter(_this, void 0, void 0, function () {
                                var _i, chunk_2, item, reqbody, response;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _i = 0, chunk_2 = chunk;
                                            _a.label = 1;
                                        case 1:
                                            if (!(_i < chunk_2.length)) return [3 /*break*/, 4];
                                            item = chunk_2[_i];
                                            reqbody = {
                                                Cid: item.cid,
                                                hospCode: item.hospcode,
                                                drugAllergy: item.drugallergy.map(function (allergy) { return ({
                                                    drugcode: allergy.drugcode,
                                                    drugallergy: allergy.drugallergy,
                                                    drugsymptom: allergy.drugsystom,
                                                }); }),
                                            };
                                            return [4 /*yield*/, DrugAxios(reqbody)];
                                        case 2:
                                            response = _a.sent();
                                            // Push the response to the chunkResponses array
                                            chunkResponses_1.push(response);
                                            _a.label = 3;
                                        case 3:
                                            _i++;
                                            return [3 /*break*/, 1];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 4:
                        responsesArray = _a.sent();
                        if (!chunkResponses_1) return [3 /*break*/, 6];
                        today = new Date();
                        nextWeek = new Date(today);
                        nextWeek.setDate(today.getDate());
                        nextWeek.setHours(0, 0, 0, 0);
                        // เปลี่ยนเวลาให้เป็น 23:59:00
                        nextWeek.setHours(23, 59, 0, 0);
                        axiosConfig = {
                            baseURL: "".concat(_config_1.END_POINT, "/eventdrugaligy/"),
                            headers: {
                                'X-API-KEY': "".concat(_config_1.Token_DrugAllgy),
                                'Content-Type': 'application/json',
                            },
                        };
                        formattedDate = today.toISOString().slice(0, 10);
                        formattedNextWeek = nextWeek.toISOString().slice(0, 10);
                        return [4 /*yield*/, axios_1.default.post('/', { date: maxDate_1, dateUpdate: formattedNextWeek + ' 23.59.00' }, axiosConfig)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, chunkResponses_1];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_3 = _a.sent();
                        console.error(error_3);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    HieService.prototype.ServiceCheckVisitTicket = function (ticketCheckPassCode) {
        return __awaiter(this, void 0, void 0, function () {
            var checkToken, checkNewDate, callGetVisit;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (reslove, reject) {
                            try {
                                var _a = axios_1.default
                                    .post("".concat(_config_1.END_POINT, "/checkticketid/"), { ticket: ticketCheckPassCode }, // Use the passed dataDrug
                                {
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'x-api-key': "".concat(_config_1.Token_DrugAllgy),
                                    },
                                })
                                    .then(function (result) {
                                    return reslove(result.data);
                                }), data = _a.data, status_2 = _a.status;
                            }
                            catch (error) { }
                        })];
                    case 1:
                        checkToken = _a.sent();
                        checkNewDate = new Date();
                        //เช็ค ticket ว่าหมดอายุรึยัง
                        if (checkToken.msg.expireTicket >= (0, moment_1.default)(checkNewDate).format('YYYY-MM-DD HH:mm:ss')) {
                            callGetVisit = new Promise(function (resolve, reject) {
                                //  ส่งค่า listdate ชองคนไข้
                                var queryText = "\n        SELECT ov.vstdate,10691 AS hospcode ,(SELECT hospital_thai_name  FROM hospital_profile)As hosname ,p.cid,p.hn,p.pname,p.fname,p.lname,sex.name as sex,p.birthday,(year(CURDATE())-YEAR(p.birthday)) as age,icd101.code as diagcode,icd101.name as diagname,dt.name as diagtype  FROM vn_stat  as vn      \n        LEFT JOIN patient as p  on p.cid = vn.cid\n        LEFT JOIN ovst as ov  on ov.hn = vn.hn\n        LEFT join icd101 on icd101.code=vn.pdx\n        LEFT JOIN sex on sex.code=p.sex\n        left join ovstdiag od on od.vn=ov.vn\n        left join diagtype dt on dt.diagtype = od.diagtype\n        WHERE vn.cid='".concat(checkToken.msg.cidPatient, "'\n        Group by ov.vstdate\n        ORDER by ov.vstdate Desc\n\n        ");
                                var visitListArray = { visit: [] };
                                dbconfig_1.default.query(queryText, function (err, resQueryVisitList) {
                                    if (err) {
                                        resolve('Query ผิดพลาด');
                                    }
                                    else {
                                        var patient = {
                                            status: '200',
                                            message: 'OK',
                                            person: {
                                                hospcode: "".concat(resQueryVisitList[0].hospcode),
                                                hospname: "".concat(resQueryVisitList[0].hosname),
                                                cid: "".concat(resQueryVisitList[0].cid),
                                                hn: "".concat(resQueryVisitList[0].hn),
                                                prename: "".concat(resQueryVisitList[0].pname),
                                                name: "".concat(resQueryVisitList[0].fname),
                                                lname: "".concat(resQueryVisitList[0].lname),
                                                sex: "".concat(resQueryVisitList[0].sex),
                                                birth: "".concat((0, moment_1.default)(resQueryVisitList[0].birthday).format('YYYY-MM-DD')),
                                                age: "".concat(resQueryVisitList[0].age),
                                            },
                                        };
                                        for (var index = 0; index < resQueryVisitList.length; index++) {
                                            visitListArray.visit.push({
                                                date_serv: "".concat((0, moment_1.default)(resQueryVisitList[index].vstdate).format('YYYY-MM-DD')),
                                                diag_opd: [
                                                    {
                                                        diagtype: "".concat(resQueryVisitList[index].diagtype),
                                                        diagcode: "".concat(resQueryVisitList[index].diagcode),
                                                        diagname: "".concat(resQueryVisitList[index].diagname),
                                                    },
                                                ],
                                            });
                                        }
                                        var patientWithVisits = __assign(__assign({}, patient), { visit: visitListArray.visit });
                                        resolve(patientWithVisits);
                                    }
                                });
                            });
                            return [2 /*return*/, callGetVisit];
                        }
                        else {
                            return [2 /*return*/, { status: 400, msg: 'ticket หมดอายุ' }];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    HieService.prototype.ServiceGetVisitListDate = function (ticketCheckPassCode, date_serv) {
        return __awaiter(this, void 0, void 0, function () {
            var checkToken, checkNewDate, callGetVisitDate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (reslove, reject) {
                            try {
                                var _a = axios_1.default
                                    .post("".concat(_config_1.END_POINT, "/checkticketid/"), { ticket: ticketCheckPassCode }, // Use the passed dataDrug
                                {
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'x-api-key': "".concat(_config_1.Token_DrugAllgy),
                                    },
                                })
                                    .then(function (result) {
                                    return reslove(result.data);
                                }), data = _a.data, status_3 = _a.status;
                            }
                            catch (error) { }
                        })];
                    case 1:
                        checkToken = _a.sent();
                        checkNewDate = new Date();
                        //เช็ค ticket ว่าหมดอายุรึยัง
                        if (checkToken.msg.expireTicket >= (0, moment_1.default)(checkNewDate).format('YYYY-MM-DD HH:mm:ss')) {
                            callGetVisitDate = new Promise(function (resolve, reject) {
                                var sql = "SELECT 10691 as hospcode, (SELECT hospital_thai_name  FROM hospital_profile)As hosname,p.cid,p.hn,p.pname,p.fname,p.lname,sex.name as sex,p.birthday,( YEAR(CURDATE()) - YEAR(p.birthday)) AS age,ov.vstdate as date_serv,\n        op.temperature as btemp,op.bps as systolic,op.bpd as diastolic,op.pulse,rr as respiratory,op.height as height,op.waist as weight,op.bmi,concat(op.cc,',',op.hpi,',',p.clinic) as chiefcomp,\n        ov.pdx as diagcode,icd.name as diagname ,ov.dx_doctor,dr.name as doctor,dt.name as diagtype,opi.icode,d.did,concat(d.name,' ',d.strength) as drugname,opi.qty as amount,d.units\n        ,ds.code as drugusage,opr.icd9 as procedcode,icd9.name as procedname,lo.lab_items_code as labtest,li.lab_items_name as labname,lo.lab_order_result as labresult,li.lab_items_normal_value as labnormal\n        from opdscreen op \n        LEFT JOIN patient p on op.hn=p.hn\n        LEFT JOIN vn_stat ov on op.vn=ov.vn\n        LEFT JOIN icd101 icd on ov.pdx=icd.code\n        LEFT JOIN sex on sex.code=p.sex\n        LEFT JOIN ovstdiag od on od.vn=ov.vn\n        left join diagtype dt on dt.diagtype=od.diagtype\n        left join doctor dr on dr.code =ov.dx_doctor\n        left join opitemrece opi on opi.vn=op.vn\n        left join drugitems d on d.icode =opi.icode\n        left join drugusage ds on ds.drugusage=d.drugusage\n        left join doctor_operation opr on opr.vn =op.vn \n        left join icd9cm1 icd9 on icd9.code=opr.icd9\n        left join lab_head lh on lh.vn=op.vn\n        left join lab_order lo on lo.lab_order_number=lh.lab_order_number\n        left join lab_items li on li.lab_items_code =lo.lab_items_code\n        \n        where p.cid='".concat(checkToken.msg.cidPatient, "' and ov.vstdate ='").concat(date_serv, "'\n        ");
                                var daigOpd = { diag_opd: [] };
                                var drugOpd = { drug_opd: [] };
                                var procudureOpd = { procudure_opd: [] };
                                var labOpd = { labfu: [] };
                                dbconfig_1.default.query(sql, function (err, result) {
                                    if (err) {
                                        console.log(err);
                                        reject('Query ผิดพลาด');
                                    }
                                    else {
                                        var currentDiagCode = null;
                                        var currentDidstd = null;
                                        var currentProcedCode = null;
                                        var curretLabsFull = null;
                                        for (var index = 0; index < result.length; index++) {
                                            // lab
                                            var labtest = result[index].labtest;
                                            if (labtest != null) {
                                                if (curretLabsFull === null || curretLabsFull !== labtest) {
                                                    labOpd.labfu.push({
                                                        labtest: result[index].labtest,
                                                        labname: result[index].labname,
                                                        labresult: result[index].labresult,
                                                        labnormal: result[index].labnormal,
                                                    });
                                                }
                                            }
                                            // diageOPd
                                            var icodeDiag = result[index].icode;
                                            if (icodeDiag != null) {
                                                if (currentDiagCode === null || currentDiagCode !== icodeDiag) {
                                                    daigOpd.diag_opd.push({
                                                        diagtype: result[index].diagtype,
                                                        diagcode: result[index].icode,
                                                        diagname: result[index].diagtype.diagname
                                                    });
                                                }
                                            }
                                            // หัตถการ
                                            var procedcode = result[index].procedcode;
                                            if (procedcode != null) {
                                                if (currentProcedCode === null || currentProcedCode !== procedcode) {
                                                    procudureOpd.procudure_opd.push({
                                                        procedcode: procedcode,
                                                        procedname: result[index].procedname,
                                                    });
                                                }
                                            }
                                            // รายการยา
                                            var did = result[index].did;
                                            if (did != null) {
                                                if (currentDidstd === null || currentDidstd !== did) {
                                                    currentDidstd = did;
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
                                        var getDatePatient = {
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
                                                birth: (0, moment_1.default)(result[0].birthday).format('YYYY-MM-DD'),
                                                age: result[0].age,
                                            },
                                            visit: {
                                                date_serv: (0, moment_1.default)(result[0].date_serv).format('YYYY-MM-DD'),
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
                            return [2 /*return*/, callGetVisitDate];
                        }
                        else {
                            return [2 /*return*/, { status: 400, msg: 'ticket หมดอายุ' }];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return HieService;
}());
exports.default = HieService;
