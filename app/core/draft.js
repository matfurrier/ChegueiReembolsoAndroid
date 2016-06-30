import uuid from 'node-uuid';
import moment from 'moment';

class DraftUtils {
  constructor(){}

  createEmptyDraft() {
    let draft = {
      data: new Date(),
      id_draft: uuid.v1(),
      cliente: null,
      descricao: CONFIGS.defaultValues.reportDescription,
      refeicao: CONFIGS.defaultValues.launchPrice,
      outrosGastos: CONFIGS.defaultValues.transportPrice,
      duracao: null,
      image: {
        title: 'Imagem de nota de reembolso',
        data: null
      }
    };

    VisitsReportDrafts.push(draft);

    Storage.saveVisitsReportDrafts(VisitsReportDrafts);

    return draft;
  }

  createDraft(draft) {
    draft.data = new Date(moment(draft.datePicker).toDate());
    draft.id_draft = uuid.v1();

    VisitsReportDrafts.push(draft);

    Storage.saveVisitsReportDrafts(VisitsReportDrafts);
  }

  updateDraft(draft) {
    let draftInfo = this.findDraft(draft.id_draft, true);

    if (draftInfo.draft) {
      draft.data = new Date(moment(draft.datePicker).toDate());
      VisitsReportDrafts[draftInfo.index] = draft;
      Storage.saveVisitsReportDrafts(VisitsReportDrafts);
    }
  }

  deleteDraft(draft) {
    let draftInfo = this.findDraft(draft.id_draft, true);

    if (draftInfo.draft) {
      VisitsReportDrafts.splice(draftInfo.index, 1);
      Storage.saveVisitsReportDrafts(VisitsReportDrafts);
    }
  }

  findDraft(id_draft, returnIndex) {
    let draft;
    let index = -1;

    for (let i = 0; i < VisitsReportDrafts.length; i++) {

      if (VisitsReportDrafts[i].id_draft == id_draft) {
        draft = VisitsReportDrafts[i];
        index = i;
        break;
      }
    }

    if (returnIndex) {
      return {
        draft: draft,
        index: index
      };
    }

    return draft;
  }
}

let Draft = new DraftUtils();

export { Draft };

// TODO
// saveDraft(report) {
//   const savingToast = Toast.create({
//     message: 'Salvando reembolso...',
//   });
//
//   this.nav.present(savingToast);
//
//   let bkpReport = report;
//
//   Draft.deleteDraft(report);
//
//   this.http.post('crm.visitsReport/saveVisitReport',  {
//     params: new Map(),
//     needAuth: true,
//     data: report,
//     handler: (resp, err) => {
//       savingToast.dismiss();
//
//       if (err) {
//         const errorToast = Toast.create({
//           message: `Erro ao salvar relatório. ${err.message}`,
//           duration: 5000,
//           showCloseButton: true,
//           closeButtonText: 'Ok'
//         });
//
//         this.nav.present(errorToast);
//         savingToast.destroy();
//
//         Draft.createDraft(bkpReport);
//       } else {
//         const successToast = Toast.create({
//           message: 'Reembolso salvo com sucesso',
//           duration: 3000,
//           showCloseButton: true,
//           closeButtonText: 'Ok'
//         });
//
//         this.nav.present(successToast);
//
//         savingToast.destroy();
//       }
//     }
//   });
// }
