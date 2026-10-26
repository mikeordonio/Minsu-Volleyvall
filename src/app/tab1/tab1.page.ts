import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RosterService, Team } from '../services/roster.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {
  player = {
    name: '',
    jerseyNumber: 1,
    position: 'Outside Hitter',
    team: 'Mens' as Team,
    yearLevel: '1st Year',
    course: '',
  };
  saving = false;
  toastOpen = false;
  toastMessage = '';
  toastColor: 'success' | 'warning' | 'danger' = 'success';

  private readonly rosterService = inject(RosterService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  async createPlayer(): Promise<void> {
    if (!this.player.name.trim() || !this.player.course.trim()) {
      await this.showToast('Name and course are required.', 'warning');
      return;
    }

    this.saving = true;
    try {
      await this.rosterService.createPlayer({ ...this.player, name: this.player.name.trim(), course: this.player.course.trim() });
      this.player = { name: '', jerseyNumber: 1, position: 'Outside Hitter', team: 'Mens', yearLevel: '1st Year', course: '' };
      await this.showToast('Player added to the roster.', 'success');
    } catch {
      await this.showToast('Could not add the player. Check that Firestore is enabled and allows writes.', 'danger');
    } finally {
      this.saving = false;
      this.changeDetector.detectChanges();
    }
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    this.toastMessage = message;
    this.toastColor = color;
    this.toastOpen = true;
  }

}
