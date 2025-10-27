"""Gioco del Tris (Tic-Tac-Toe) da riga di comando.

Consente a due giocatori umani di sfidarsi inserendo a turno
le coordinate della casella desiderata.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional


@dataclass
class Giocatore:
    simbolo: str

    def __str__(self) -> str:  # pragma: no cover - semplice alias testuale
        return self.simbolo


class Tris:
    dimensione: int = 3

    def __init__(self) -> None:
        self.tabellone: List[List[str]] = [[" " for _ in range(self.dimensione)] for _ in range(self.dimensione)]
        self.giocatori = (Giocatore("X"), Giocatore("O"))
        self.turno_corrente = 0

    def mostra_tabellone(self) -> str:
        """Restituisce una rappresentazione testuale del tabellone."""
        separatore = "-" * (self.dimensione * 4 - 1)
        righe = []
        for riga in self.tabellone:
            righe.append(" | ".join(riga))
        return f"\n{separatore}\n".join(righe)

    def casella_vuota(self, riga: int, colonna: int) -> bool:
        return self.tabellone[riga][colonna] == " "

    def posiziona_simbolo(self, riga: int, colonna: int) -> None:
        if not (0 <= riga < self.dimensione and 0 <= colonna < self.dimensione):
            raise ValueError("Coordinate fuori dal tabellone")
        if not self.casella_vuota(riga, colonna):
            raise ValueError("Casella già occupata")
        simbolo = self.giocatori[self.turno_corrente].simbolo
        self.tabellone[riga][colonna] = simbolo

    def controllo_vittoria(self) -> Optional[Giocatore]:
        linee = []
        # Righe e colonne
        linee.extend(self.tabellone)
        linee.extend([[self.tabellone[r][c] for r in range(self.dimensione)] for c in range(self.dimensione)])
        # Diagonali
        linee.append([self.tabellone[i][i] for i in range(self.dimensione)])
        linee.append([self.tabellone[i][self.dimensione - 1 - i] for i in range(self.dimensione)])

        for linea in linee:
            if linea.count(linea[0]) == self.dimensione and linea[0] != " ":
                simbolo_vincente = linea[0]
                return next(g for g in self.giocatori if g.simbolo == simbolo_vincente)
        return None

    def controllo_pareggio(self) -> bool:
        return all(cellula != " " for riga in self.tabellone for cellula in riga)

    def cambia_turno(self) -> None:
        self.turno_corrente = 1 - self.turno_corrente

    def giocatore_corrente(self) -> Giocatore:
        return self.giocatori[self.turno_corrente]


def leggi_coordinate() -> Optional[tuple[int, int]]:
    try:
        valori = input("Inserisci riga e colonna (separate da spazio, oppure q per uscire): ").strip()
    except EOFError:
        return None

    if valori.lower() in {"q", "quit", "esci", "exit"}:
        return None

    parti = valori.split()
    if len(parti) != 2:
        print("Inserisci esattamente due numeri.")
        return leggi_coordinate()

    try:
        riga, colonna = (int(parte) for parte in parti)
    except ValueError:
        print("Le coordinate devono essere numeri interi.")
        return leggi_coordinate()

    return riga, colonna


def gioca() -> None:
    gioco = Tris()
    print("Benvenuti nel gioco del Tris! Le coordinate partono da 0.")
    while True:
        print("\nTabellone attuale:")
        print(gioco.mostra_tabellone())

        giocatore = gioco.giocatore_corrente()
        print(f"Turno del giocatore {giocatore}.")
        coordinate = leggi_coordinate()
        if coordinate is None:
            print("Partita terminata. Arrivederci!")
            return

        riga, colonna = coordinate
        try:
            gioco.posiziona_simbolo(riga, colonna)
        except ValueError as err:
            print(err)
            continue

        vincitore = gioco.controllo_vittoria()
        if vincitore:
            print(gioco.mostra_tabellone())
            print(f"Complimenti! Il giocatore {vincitore} ha vinto.")
            return

        if gioco.controllo_pareggio():
            print(gioco.mostra_tabellone())
            print("La partita è terminata in pareggio.")
            return

        gioco.cambia_turno()


if __name__ == "__main__":
    gioca()
