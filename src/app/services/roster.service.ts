import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getFirestore,
  updateDoc,
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { environment } from '../../environments/environment';

export type Team = 'Mens' | 'Womens';

export interface Player {
  id?: string;
  name: string;
  jerseyNumber: number;
  position: string;
  team: Team;
  yearLevel: string;
  course: string;
}

interface RestField {
  stringValue?: string;
  integerValue?: string;
}

interface RestDocument {
  name: string;
  fields: Record<string, RestField>;
}

const firebaseApp = initializeApp(environment.firebaseConfig);

@Injectable({ providedIn: 'root' })
export class RosterService {
  private readonly firestore = getFirestore(firebaseApp);
  private readonly playersCollection = collection(this.firestore, 'players');
  private readonly operationTimeout = 10000;
  private readonly playersUrl = `https://firestore.googleapis.com/v1/projects/${environment.firebaseConfig.projectId}/databases/(default)/documents/players`;

  watchPlayers(onChange: (players: Player[]) => void, onError: (error: Error) => void): () => void {
    let active = true;
    this.withTimeout(this.fetchPlayers()).then(
      (players) => {
        if (active) {
          onChange(players);
        }
      },
    ).catch((error: unknown) => {
        if (active) {
          onError(error instanceof Error ? error : new Error('Unable to read the Firestore roster.'));
        }
      });
    return () => {
      active = false;
    };
  }

  async createPlayer(player: Omit<Player, 'id'>): Promise<void> {
    await this.withTimeout(addDoc(this.playersCollection, player));
  }

  async updatePlayer(player: Player): Promise<void> {
    if (!player.id) {
      throw new Error('The player document has no ID.');
    }

    const { id, ...changes } = player;
    await this.withTimeout(updateDoc(doc(this.firestore, 'players', id), changes));
  }

  async deletePlayer(id: string): Promise<void> {
    await this.withTimeout(deleteDoc(doc(this.firestore, 'players', id)));
  }

  private async withTimeout<T>(operation: Promise<T>): Promise<T> {
    return Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error('Firestore did not respond. Confirm that Firestore is enabled and its rules allow writes.')), this.operationTimeout);
      }),
    ]);
  }

  private async fetchPlayers(): Promise<Player[]> {
    const response = await fetch(`${this.playersUrl}?orderBy=name&key=${environment.firebaseConfig.apiKey}`);
    if (!response.ok) {
      throw new Error(`Firestore returned status ${response.status}.`);
    }

    const data = (await response.json()) as { documents?: RestDocument[] };
    return (data.documents ?? [])
      .map((document) => this.mapRestDocument(document))
      .sort((first, second) => first.name.localeCompare(second.name));
  }

  private mapRestDocument(document: RestDocument): Player {
    const fields = document.fields;
    return {
      id: document.name.split('/').pop(),
      name: fields['name']?.stringValue ?? '',
      jerseyNumber: Number(fields['jerseyNumber']?.integerValue ?? 0),
      position: fields['position']?.stringValue ?? '',
      team: (fields['team']?.stringValue ?? 'Mens') as Team,
      yearLevel: fields['yearLevel']?.stringValue ?? '',
      course: fields['course']?.stringValue ?? '',
    };
  }
}