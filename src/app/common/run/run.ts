import { LocalPlayerData } from "../user/local-player-data";
import { Player } from "../player/player";
import { RunMode } from "./run-mode";
import { RunData } from "./run-data";
import { GameState } from "../player/game-state";
import { Task } from "../opengoal/task";
import { Team } from "./team";
import { Timer } from "./timer";
import { PlayerState } from "../player/player-state";
import { RunState } from "./run-state";
import { MultiLevel } from "../opengoal/levels";
import { OG } from "../opengoal/og";
import { UserBase } from "../user/user";

export class Run {
    data: RunData;
    teams: Team[] = [];
    spectators: Player[] = [];
    timer: Timer;

    constructor(runData: RunData) {
        this.data = runData;
        this.timer = new Timer(this.data.countdownSeconds);

        if (this.data.teams > 1) {
            for (let i = 0; i < this.data.teams; i++)
                this.teams.push(new Team(i, "Team " + (i + 1)));
        }
        else
            this.teams.push(new Team(0, "Team"));
    }

    removePlayer(playerId: string): void {
        let team = this.getPlayerTeam(playerId);
        if (!this.timer.runIsOngoing()) {
            this.spectators = this.spectators.filter(x => x.user.id !== playerId);
            if (!team) return;
            team.players = team.players.filter(x => x.user.id !== playerId);
        }
        else {
            let runplayer = this.getPlayer(playerId);
            if (!runplayer) return;
            if (team)
                runplayer.state = PlayerState.Disconnected;
            else
                this.spectators = this.spectators.filter(x => x.user.id !== playerId);
        }
    }

    toggleVoteReset(playerId: string, state: PlayerState): boolean {
        let player = this.getPlayer(playerId);
        if (!player) return false;
        player.state = state;

        if (state === PlayerState.WantsToReset)
            return this.checkForRunReset();

        return false;
    }

    checkForRunReset(): boolean {
        let players = this.teams.flatMap(x => x.players);
        if (players.filter(x => x.state === PlayerState.WantsToReset).length / players.length <= 0.65)
            return false;
        
        this.timer.reset();
        this.teams.forEach(team => {
            team.resetForRun();
        });
        return true;
    }

    endPlayerRun(playerId: string, forfeit: boolean): void {
        let player = this.getPlayer(playerId);
        if (!player) return;
        player.state = forfeit ? PlayerState.Forfeit : PlayerState.Finished;
        if (this.everyoneHasFinished() || (!forfeit && this.isMode(RunMode.Lockout)))
            this.timer.runState = RunState.Ended;
    }

    everyoneHasFinished(): boolean {
        return this.teams.every(x => x.players.every(y => y.state === PlayerState.Finished || y.state === PlayerState.Forfeit));
    }

    updateState(playerId: string, state: GameState): void {
        let player = this.getPlayer(playerId);
        if (!player) return;
        player.gameState = state;
    }

    reconnectPlayer(playerId: string) {
        let player = this.getPlayer(playerId);
        if (!player) return;
        player.state = PlayerState.Ready;
    }

    addSplit(task: Task): void {
            this.getPlayerTeam(task.obtainedById)?.addTask(task);
    }

    toggleReady(playerId: string, state: PlayerState): void {
        let player = this.getPlayer(playerId);
        if (!player) return;
        player.state = state;
    }

    everyoneIsReady(): boolean {
        return this.teams.every(x => x.players.every(y => y.state === PlayerState.Ready));
    }

    start(startDate: Date) {
        startDate.setSeconds(startDate.getSeconds() + this.timer.countdownSeconds - 1);
        this.timer.startTimer(startDate.getTime());
        OG.runCommand("(start 'play (get-continue-by-name *game-info* \"village1-hut\"))");
    }

    setOrbCosts(playerId: string) {
        if (!this.data.normalCellCost && (this.isMode(RunMode.Lockout) || (this.getPlayerTeam(playerId)?.players.length ?? 0) > 1)) {
            OG.runCommand("(set! (-> *GAME-bank* money-task-inc) 180.0)");
            OG.runCommand("(set! (-> *GAME-bank* money-oracle-inc) 240.0)");
        }
        else {
            OG.runCommand("(set! (-> *GAME-bank* money-task-inc) 90.0)");
            OG.runCommand("(set! (-> *GAME-bank* money-oracle-inc) 120.0)");
        }
    }

    changeTeam(user: UserBase | undefined, teamId: number) {
        if (!user) return;
        let newTeam = this.getTeam(teamId);
        if (!newTeam) return;
    
        let oldTeam = this.getPlayerTeam(user.id);
        let player = oldTeam ? oldTeam.players.find(x => x.user.id === user.id) : new Player(user);
        newTeam.players.push(player!);
        this.spectators = this.spectators.filter(x => x.user.id !== user.id);

        //cheap method of forcing screen to re-render old team
        if (oldTeam) {
            let players = oldTeam.players.filter(x => x.user.id !== user.id);
            oldTeam.players = [];
            oldTeam.players = players;
        }
    }
    
    getTimerShortenedFormat(): string {
        let time = this.timer.time + this.timer.timeMs;
        for (let i = 0; i < 3 && (time.charAt(0) === "0" || time.charAt(0) === ":"); i++)
            time = time.substring(1);
        return time;
    }

    getTeam(teamId: number): Team | undefined {
        return this.teams.find(x => x.id === teamId);
    }

    getPlayerTeam(playerId: string): Team | undefined {
        return this.teams.find(x => x.players.some(player => player.user.id === playerId));
    }

    getPlayer(playerId: string): Player | undefined {
        return this.getPlayerTeam(playerId)?.players.find(x => x.user.id === playerId) ?? this.spectators.find(x => x.user.id === playerId);
    }

    getAllPlayers(): Player[] {
        return this.teams.flatMap(x => x.players);
    }

    getAllTask(): Task[] {
        return this.teams.flatMap(x => x.tasks);
    }


    playerTeamHasCell(task: string, playerId: string): boolean {
        return this.getPlayerTeam(playerId)?.hasTask(task) ?? false;
    }

    runHasCell(task: string): boolean {
        return this.teams.some(x => x.tasks.some(y => y.gameTask === task));
    }

    hasSpectator(playerId: string): boolean {
        return this.spectators.find(x => x.user.id === playerId) !== undefined;
    }

    isMode(mode: RunMode): boolean {
        return this.data.mode === mode;
    }


    // --- RUN METHODS INVOLVING OPENGOAL ---

    //used to sync runs between players for user join or in case of desync
    importTaskChanges(localPlayer: LocalPlayerData, run: Run) {

        //handle team events
        this.teams.forEach(team => {
            let importTeam = run.teams.find(x => x.id === team.id);
            if (importTeam) {
                //localPlayer player class, use to check if this is curernt players TEAM
                let localImportedPlayer = team.players.find(x => x.user.id === localPlayer.user.id);
                //check for new tasks to give player
                if (localImportedPlayer || this.isMode(RunMode.Lockout)) {
                    importTeam.tasks.filter(x => x.isCell && !team.tasks.some(({ gameTask: task }) => task === x.gameTask)).forEach(task => {
                        this.giveCellToUser(task, localImportedPlayer?.user.id);
                    });
                }

                //transfer tasks
                team.tasks = importTeam.tasks;
                team.cellCount = importTeam.cellCount;

                //state update checks
                if (localImportedPlayer) {
                    this.onUserStateChange(localPlayer, localImportedPlayer);
                }
            }
        });
    }

    giveCellToUser(task: Task, playerId: string | undefined) {
        if (!playerId || !task.isCell) return;

        if ((this.getPlayerTeam(task.obtainedById)?.id === this.getPlayerTeam(playerId)?.id || this.isMode(RunMode.Lockout))) {
            let fuelCell = Task.getCellEname(task.gameTask);
            if (fuelCell)
                OG.runCommand('(+! (-> (the fuel-cell (process-by-ename "' + fuelCell + '")) base y) (meters -200.0))');
            OG.giveCell(task.gameTask);
        }
    }

    onUserStateChange(localPlayer: LocalPlayerData, player: Player | undefined) {
        if (!player) return;
        const team = this.getPlayerTeam(player.user.id);
        if (!team) return;

        let levelToCheck = team.players[0]?.gameState.currentLevel;

        //if all on same level hub zoomer
        if (!localPlayer.restrictedZoomerLevels.includes(player.gameState.currentLevel) || team.players.every(x => x.gameState.onZoomer && x.gameState.currentLevel === levelToCheck) || this.isMode(RunMode.Lockout) && this.teams.length === 1) {
            OG.runCommand("(set-zoomer-full-mode)");
            localPlayer.restrictedZoomerLevels = localPlayer.restrictedZoomerLevels.filter(x => x !== player!.gameState.currentLevel);
        }
        else if (!this.data.allowSoloHubZoomers)
            OG.runCommand("(set-zoomer-wait-mode)");

        if (this.data.requireSameLevel) {
            if (team.players.every(x => this.isSameLevel(x.gameState.currentLevel, levelToCheck)))
                OG.runCommand("(set! *allow-cell-pickup?* #t)");
            else 
                OG.runCommand("(set! *allow-cell-pickup?* #f)");
        }
    }

    private isSameLevel(currentLevel: string, checkAgainst: string) {
        if (MultiLevel.spiderCave().includes(currentLevel) && MultiLevel.spiderCave().includes(checkAgainst))
            return true;
        if (MultiLevel.jungle().includes(currentLevel) && MultiLevel.jungle().includes(checkAgainst))
            return true;
        if (MultiLevel.lpc().includes(currentLevel) && MultiLevel.lpc().includes(checkAgainst))
            return true;
        if (currentLevel === checkAgainst)
            return true;

        return false;
    }

    reconstructRun() {
        //update run
        let teams: Team[] = [];
        for (let team of this.teams) {
            teams.push(Object.assign(new Team(team.id, team.name), team));
        }
        this.teams = teams;
        this.timer = Object.assign(new Timer(this.timer.countdownSeconds), this.timer);
        if (this.timer.runIsOngoing())
            this.timer.updateTimer();

        return this;
    }
}