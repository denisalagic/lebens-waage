import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ActivatedRoute, Router} from '@angular/router';
import {animate, state, style, transition, trigger} from "@angular/animations";
import {LocalApiCallsService} from "./local-api-calls.service";
import {AutoLogoutService} from "./auto-logout.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('animateStartButton', [
      state('original', style({
        width: '*',
        height: '*'
      })),
      state('large', style({
        width: '449px',
        height: '162px'
      })),
      transition('original => large', animate('400ms ease-in-out')),
      transition('large => original', animate('400ms ease-in-out'))
    ])
  ]
})
export class AppComponent implements AfterViewInit {
  title = 'lebens-waage';

  public selectedLanguage: string;
  public moneyAmount: number = -1;
  public showCancelButton: boolean = false;
  public showAddMoneyButton: boolean = true;
  moneyAmountAnimation: string = 'original';
  private currentlyAddingMoney: boolean = false;
  @ViewChild('videoPlayer', {static: false}) videoplayer: ElementRef;


  constructor(private translate: TranslateService,
              private router: Router,
              public route: ActivatedRoute,
              private localApiCallsService: LocalApiCallsService,
              private autoLogoutService: AutoLogoutService) {
    translate.addLangs(['en', 'de', 'hr']);
    translate.setDefaultLang('de');
    translate.use('de');
    this.selectedLanguage = 'de';
    this.moneyAmountAnimation = 'original';
  }

  ngAfterViewInit(): void {
    //this.videoplayer.nativeElement.play();
  }

  public getCurrentMoneyAmount(): number {
    return this.moneyAmount == -1 ? 0 : this.moneyAmount;
  }

  public setLanguage(language: string) {
    this.translate.use(language);
    this.selectedLanguage = language;
  }

  public startMoneySession() {
    this.autoLogoutService.init();
    this.showAddMoneyButton = false;
    this.showCancelButton = true;
    if (this.moneyAmount == -1) {
      this.moneyAmount = 0;
      this.localApiCallsService.startMoneySession().subscribe(resp => {
        this.addMoney();
      });
    }
  }

  private addMoney() {
    if (!this.currentlyAddingMoney && this.moneyAmount < 10) {
      this.currentlyAddingMoney = true;
      this.localApiCallsService.acceptMoney().subscribe(resp => {
        if(resp.success) {
          this.moneyAmount = resp.value;
        }
        this.currentlyAddingMoney = false;
        this.addMoney();
      });
    }
  }

  public returnMoney() {
    this.localApiCallsService.returnAllMoney().subscribe(resp => {
      console.log(resp);
      this.moneyAmount = -1;
      this.showCancelButton = false;
      this.showAddMoneyButton = true;
      this.localApiCallsService.closeSession().subscribe(resp => {
        console.log("close session resp,", resp);
      })
    });
  }

  public navigateToSteps() {
    if (this.moneyAmount >= 10) {
      this.router.navigate(['steps']).then(_ => {
        this.moneyAmount = -1;
        this.showCancelButton = false;
        this.showAddMoneyButton = true;
        this.localApiCallsService.returnOverflowMoney().subscribe(resp => {
          console.log("returning surplus of money");
          this.localApiCallsService.closeSession().subscribe(respCloseSession => {
            console.log("closing session");
          });

        });
      });
    }
  }

}
