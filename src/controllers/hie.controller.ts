import { NextFunction, Request, Response } from 'express';
import HieService from '@/services/hie.service';

import { resolve } from 'path';
import { Token_DrugAllgy } from '@config';
import { connect } from 'http2';
class HieControlers {
  public hieService = new HieService();
  constructor() {}
  public GetTestHie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.send('สัวสดี');
  };

  public VisitCahse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const restVisitCahse = await this.hieService.ServiceVisitCashe(Token_DrugAllgy);

    res.send(restVisitCahse);
  };

  // ส่ง ข้อมูล visitCahse ตาม ***last Update*** เช่นเขตเก็บ วันที่ แล้วเอา วันที่ ที่เขตเก็บมา bettween
  public PostDrugAllgy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const restDrugAllgy = await this.hieService.ServiceDrugAllgyCashe(Token_DrugAllgy, req.body.visitList);

    res.send(restDrugAllgy);
  };

  public GetVisitList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const restCheckVisitTicket = await this.hieService.ServiceCheckVisitTicket(req.headers['x-api-key']);
    res.send(restCheckVisitTicket);
  };
  public GetVisitDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const restCheckVisitTicket = await this.hieService.ServiceGetVisitListDate(req.headers['x-api-key'], req.body.date_serv);

    res.send(restCheckVisitTicket);
  };

  public GetAdmitList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const visitListIpd = await this.hieService.ServiceCheckVisitTicketIpd(req.headers['x-api-key']);

    res.send(visitListIpd);
  };

  public GetAdmitAn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const visitAdmitAn = await this.hieService.ServiceAdmitAn(req.headers['x-api-key'], req.body.date_serv, req.body.an);
 
    res.send(visitAdmitAn);
  };
}

export default HieControlers;
