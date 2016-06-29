import { Alert } from 'ionic-angular';

import { Draft } from '../draft';

import moment from 'moment';

const TimeLimitList = {
  MOURNING: moment.duration(8, 'hours'),
  LUNCH: moment.duration(12, 'hours'),
  BACK_LUNCH: moment.duration(13, 'hours'),
  OUT: moment.duration(18, 'hours')
};

export class DailyAlert {

  constructor(nav) {
    this.nav = nav;
    this.dailyDraft = this.checkPreviouslyDailyDraft();
    this.delayedNotification = false;

    if (this.canNotify()) {

      if (!this.dailyDraft) {
        this.createDailyDraft();
      }

      this.startWatchDog();
    }
  }

  canNotify() {
    let weekDayNow = moment().weekday();
    let canNotify = false;

    for(let weekDay of CONFIGS.notificationRole.weekDay) {

      if (weekDay.code === weekDayNow) {
        canNotify = weekDay.checked;
        break;
      }
    }

    return canNotify && !this.alerting && !this.delayedNotification;
  }

  startWatchDog() {

    this.watchDog = setInterval(() => {
      this.alert();
    }, 3000); // Each 3 seconds
  }

  stopWatchDog() {
    clearInterval(this.watchDog);
  }

  checkPreviouslyDailyDraft() {
    let dailyDraft = Storage.getItem('dailyDraft');

    if (dailyDraft && moment(dailyDraft.draft.data).format('DD') != moment().format('DD')) {
      this._popAlert('Dica!',
        `Existe um rascunho não salvo do dia ${moment(dailyDraft.draft.data).format('DD/MM/YYYY')}... Não esqueça de salvar ;)`,
        [ { text: 'Ok' } ]
      );

      Storage.saveItem('dailyDraft', null);

      return null;
    } else {
      return dailyDraft;
    }
  }

  createDailyDraft() {
    this.dailyDraft = {
      draft: Draft.createEmptyDraft(),
      mourningNotification: false,
      lunchNotification: false,
      backLaunchNotification: false,
      outNotification: false
    };

    Storage.saveItem('dailyDraft', this.dailyDraft);
  }

  alert() {

    if (this.canNotify()) {
      this.alerting = true;

      let time = moment.duration(parseInt(moment().format('HH')), 'hours')
        .add(parseInt(moment().format('MM')), 'minutes');

      let timeLimit;
      let timeLimitArray = [TimeLimitList.MOURNING, TimeLimitList.LUNCH, TimeLimitList.BACK_LUNCH, TimeLimitList.OUT];

      for (let i = 0; i < timeLimitArray.length; i++) {

        if (timeLimitArray[i + 1]) {

          if (time.asMilliseconds() >= timeLimitArray[i].asMilliseconds()
                && time.asMilliseconds() <= timeLimitArray[i + 1].asMilliseconds()) {
            timeLimit = timeLimitArray[i];
            break;
          }
        } else {
          timeLimit = TimeLimitList.OUT;
        }
      }

      switch (timeLimit) {
        case TimeLimitList.MOURNING:

          if (!this.dailyDraft.mourningNotification) {
            this.popMourningNotification();
          } else {
            this.alerting = false;
          }
          break;
        case TimeLimitList.LUNCH:

          if (!this.dailyDraft.lunchNotification) {
            this.popLunchNotification();
          } else {
            this.alerting = false;
          }
          break;
        case TimeLimitList.BACK_LUNCH:

          if (!this.dailyDraft.backLaunchNotification) {
            this.popBackLunchNotification();
          } else {
            this.alerting = false;
          }
          break;
        case TimeLimitList.OUT:

          if (!this.dailyDraft.outNotification) {
            this.popOutNotification();
          } else {
            this.alerting = false;
          }
          break;
        default:
          console.warn('[WARN] No notification limit caught');
          this.alerting = false;
          break;
      }
    }
  }

  popMourningNotification() {
    this._popAlert('Bom dia!',
      `Chegou no trabalho?`,
      [
        {
          text: 'Ainda não',
          handler: () => {
            this.alerting = false;
            this._delayNotification();
          }
        },
        {
          text: 'Cheguei!',
          handler: () => {
            this.dailyDraft.draft.horaChegada = moment().format();

            Draft.updateDraft(this.dailyDraft.draft);

            this.dailyDraft.mourningNotification = true;

            Storage.saveItem('dailyDraft', this.dailyDraft);

            this.alerting = false;
          }
        }
      ]
    );
  }

  popLunchNotification() {
    this._popAlert('Chegou a hora boa!',
      `Saindo para almoçar?`,
      [
        {
          text: 'Ainda não',
          handler: () => {
            this.alerting = false;
            this._delayNotification();
          }
        },
        {
          text: 'Sim',
          handler: () => {
            this.dailyDraft.lunchOut = moment().format();
            this.dailyDraft.lunchNotification = true;

            Storage.saveItem('dailyDraft', this.dailyDraft);

            this.alerting = false;
          }
        }
      ]
    );
  }

  popBackLunchNotification() {
    this._popAlert('Um cafezinho iria bem agora...',
      `Chegou do almoço?`,
      [
        {
          text: 'Ainda não',
          handler: () => {
            this.alerting = false;
            this._delayNotification();
          }
        },
        {
          text: 'Cheguei!',
          handler: () => {
            let startDate;

            if (this.dailyDraft.lunchOut) {
              startDate = moment(this.dailyDraft.lunchOut);
            } else {
              startDate = moment().hours(TimeLimitList.LUNCH.asHours()).minutes(0);
            }

            let duration = moment.duration( moment().diff(startDate) );

            this.dailyDraft.draft.tempoImprodutivo = moment().hour(duration.hours()).minutes(duration.minutes()).format();

            Draft.updateDraft(this.dailyDraft.draft);

            this.dailyDraft.backLaunchNotification = true;

            Storage.saveItem('dailyDraft', this.dailyDraft);

            this.alerting = false;
          }
        }
      ]
    );
  }

  popOutNotification() {
    this._popAlert('Bora pra casa!',
      `Saindo do trabalho?`,
      [
        {
          text: 'Não, mais tarde',
          handler: () => {
            this.alerting = false;
            this._delayNotification();
          }
        },
        {
          text: 'Sim',
          handler: () => {
            this.dailyDraft.draft.horaSaida = moment().format();

            Draft.updateDraft(this.dailyDraft.draft);

            this.dailyDraft.outNotification = true;

            Storage.saveItem('dailyDraft', this.dailyDraft);

            this.alerting = false;
          }
        }
      ]
    );
  }

  /**
   * @private
  */
  _delayNotification() {
    this.delayedNotification = true;

    setTimeout(() => {
      this.delayedNotification = false;
    }, 900000); // 15 min
  }

  /**
   * @private
  */
  _popAlert(title, message, buttons) {
    let confirm = Alert.create({
      title: title,
      message: message,
      buttons: buttons
    });

    confirm.onDismiss(() => {
      this.alerting = false;
    });

    setTimeout(() => {
      this.nav.present(confirm);
    }, 3000);
  }
}
