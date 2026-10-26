import { ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Player, RosterService, Team } from '../services/roster.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnDestroy {
  players: Player[] = [];
  selectedTeam: 'All' | Team = 'All';
  searchTerm = '';
  editingPlayer: Player | null = null;
  isEditModalOpen = false;
  loading = true;
  errorMessage = '';
  toastOpen = false;
  toastMessage = '';
  toastColor: 'success' | 'danger' = 'success';
  private stopWatching: (() => void) | undefined;

  private readonly rosterService = inject(RosterService);
  private readonly alertController = inject(AlertController);
  private readonly changeDetector = inject(ChangeDetectorRef);

  ionViewWillEnter(): void {
    this.loadRoster();
  }

  private loadRoster(): void {
    this.stopWatching?.();
    this.loading = true;
    this.errorMessage = '';
    this.stopWatching = this.rosterService.watchPlayers(
      (players) => {
        this.players = players;
        this.loading = false;
        this.changeDetector.detectChanges();
      },
      () => {
        this.errorMessage = 'Unable to load the roster. Confirm that Firestore is enabled and its rules allow reads.';
        this.loading = false;
        this.changeDetector.detectChanges();
      },
    );
  }

  ngOnDestroy(): void {
    this.stopWatching?.();
  }

  get visiblePlayers(): Player[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.players.filter((player) => {
      const matchesTeam = this.selectedTeam === 'All' || player.team === this.selectedTeam;
      const matchesSearch = !search || `${player.name} ${player.course} ${player.position}`.toLowerCase().includes(search);
      return matchesTeam && matchesSearch;
    });
  }

  startEditing(player: Player): void {
    this.editingPlayer = { ...player };
    this.isEditModalOpen = true;
  }

  cancelEditing(): void {
    this.editingPlayer = null;
    this.isEditModalOpen = false;
  }

  async savePlayer(): Promise<void> {
    if (!this.editingPlayer) {
      return;
    }

    try {
      await this.rosterService.updatePlayer(this.editingPlayer);
      this.cancelEditing();
      this.loadRoster();
      await this.showToast('Player updated.', 'success');
    } catch {
      await this.showToast('Could not update the player.', 'danger');
    }
  }

  async confirmDelete(player: Player): Promise<void> {
    if (!player.id) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Delete player?',
      message: `Remove ${player.name} from the roster?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => this.deletePlayer(player.id as string) },
      ],
    });
    await alert.present();
  }

  private async deletePlayer(id: string): Promise<void> {
    try {
      await this.rosterService.deletePlayer(id);
      this.loadRoster();
      await this.showToast('Player removed from the roster.', 'success');
    } catch {
      await this.showToast('Could not delete the player.', 'danger');
    }
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    this.toastMessage = message;
    this.toastColor = color;
    this.toastOpen = true;
  }

  refreshRoster(event: CustomEvent): void {
    this.loadRoster();
    (event.target as HTMLIonRefresherElement).complete();
  }

}
