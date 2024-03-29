import { Cell } from "./cell";
import { Randomizer } from "./randomizer";
import { Rule } from "./rule";

export class Preset {

    name: string;
    description: string;
    randomizer: Randomizer;
    rules: Rule[];
    //!TODO: Should probably be made into an enum
    lockLevel: number; //0 - nothing. 1 - cellsInRun. 2 - endAtFinalBoss. 3 - sameLevelPercent,sameLevelPercentOrbcells. 4 - cellsShownInAdvance.

    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
        this.randomizer = new Randomizer();
        this.rules = Rule.ListRules();
        this.lockLevel = 0;
    }

    //Generations
    downloadLssFile() {
        var element = document.createElement('a');
        let data = encodeURIComponent(this.writeLssFile());
        element.setAttribute('href', 'data:Application/octet-stream;charset=UTF-8,' + data);
        element.setAttribute('download', 'JakCoR.lss');

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    private writeLssFile(): string {
        const xmlBase = '<?xml version="1.0" encoding="UTF-8"?><Run version="1.7.0"><GameIcon /><GameName>Jak and Daxter: The Precursor Legacy</GameName><CategoryName>Randomizer: ' + this.name + '</CategoryName><LayoutPath></LayoutPath><Metadata><Run id="' + this.randomizer.seed + '" /><Platform usesEmulator="False"></Platform><Region></Region><Variables /></Metadata><Offset>-00:00:01.60</Offset><AttemptCount>0</AttemptCount><AttemptHistory /><Segments></Segments><AutoSplitterSettings /></Run>';
        var parser = new DOMParser();
        var xmlDoc: Document = parser.parseFromString(xmlBase, "text/xml");
        var segments = xmlDoc.getElementsByTagName("Segments");
        
        const sortedCells: Cell[] = this.randomizer.cells.filter(x => x.cellNumber).sort((a,b) => ((a.cellNumber as number) > (b.cellNumber as number)) ? 1 : (((b.cellNumber as number) > (a.cellNumber as number)) ? -1 : 0));
        sortedCells.forEach(cell => {
            segments[0].appendChild(this.generateCellXmlSegment(xmlDoc, "[Cell " + cell.cellNumber + "] " + cell.level + ": " + cell.name));
        });
        if (this.randomizer.endAtFinalBoss)
            segments[0].appendChild(this.generateCellXmlSegment(xmlDoc, "[END] Citadel: Final Boss"))

        var serializer = new XMLSerializer();
        return serializer.serializeToString(xmlDoc);
    }
    
    private generateCellXmlSegment(xmlDoc: Document, splitname: string): any {
        let segment = xmlDoc.createElement("Segment");
        let name = xmlDoc.createElement("Name");
        name.innerHTML = splitname;
        segment.appendChild(name);

        let splitTimes = xmlDoc.createElement("SplitTimes");
        let splitTime = xmlDoc.createElement("SplitTime");
        splitTime.setAttribute("name", "Personal Best");
        splitTimes.appendChild(splitTime);
        segment.appendChild(splitTimes);

        segment.appendChild(xmlDoc.createElement("BestSegmentTime"));
        segment.appendChild(xmlDoc.createElement("SegmentHistory"));
        return segment;
    }



    public static FiddyCellRando(): Preset {
        const preset: Preset = new Preset("50 Cells", "Estimated time: 1h 30min+");
        preset.randomizer.cellsInRun = 50;
        preset.randomizer.cellsShownInAdvance = 100;
        preset.randomizer.endAtFinalBoss = false;
        preset.randomizer.sameLevelPercent = 65;
        preset.randomizer.sameLevelPercentOrbCells = 60;
        preset.randomizer.sameHubPercent = 55;
        preset.lockLevel = 2;
        return preset;
    }

    public static SeventyTwoCellRando(): Preset {
        const preset: Preset = new Preset("74 Cells", "Estimated time: 3h+");
        preset.randomizer.cellsInRun = 74;
        preset.randomizer.cellsShownInAdvance = 2;
        preset.randomizer.endAtFinalBoss = true;
        preset.randomizer.sameLevelPercent = 70;
        preset.randomizer.sameLevelPercentOrbCells = 60;
        preset.randomizer.sameHubPercent = 55;
        preset.lockLevel = 1;
        return preset;
    }

    public static ClassicRando(): Preset {
        const preset: Preset = new Preset("Classic", "Stays as true as possible to the original randomizer by SixRock with the improvments from tp971's online version. <br />Estimated time: 3h+");
        preset.randomizer.cellsInRun = 74;
        preset.randomizer.cellsShownInAdvance = 100;
        preset.randomizer.endAtFinalBoss = true;
        preset.randomizer.sameLevelPercent = 0;
        preset.randomizer.sameLevelPercentOrbCells = 0;
        preset.randomizer.sameHubPercent = 0;
        preset.lockLevel = 3;

        (preset.rules.find(x => x.id == 2) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 2) as Rule).changeableType = true;
        (preset.rules.find(x => x.id == 2) as Rule).hidden = false;
        (preset.rules.find(x => x.id == 3) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 3) as Rule).changeableType = true;
        (preset.rules.find(x => x.id == 3) as Rule).hidden = false;
        (preset.rules.find(x => x.id == 4) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 4) as Rule).changeableType = false;
        (preset.rules.find(x => x.id == 5) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 5) as Rule).changeableType = false;
        (preset.rules.find(x => x.id == 5) as Rule).hidden = true;
        (preset.rules.find(x => x.id == 6) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 6) as Rule).changeableType = false;
        (preset.rules.find(x => x.id == 6) as Rule).hidden = true;
        (preset.rules.find(x => x.id == 7) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 7) as Rule).changeableType = false;
        (preset.rules.find(x => x.id == 7) as Rule).hidden = true;
        (preset.rules.find(x => x.id == 10) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 10) as Rule).changeableType = false;
        (preset.rules.find(x => x.id == 11) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 11) as Rule).changeableType = false;
        (preset.rules.find(x => x.id == 11) as Rule).hidden = true;
        (preset.rules.find(x => x.id == 12) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 12) as Rule).changeableType = false;
        (preset.rules.find(x => x.id == 12) as Rule).hidden = true;
        (preset.rules.find(x => x.id == 13) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 13) as Rule).changeableType = false;
        (preset.rules.find(x => x.id == 14) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 14) as Rule).changeableType = false;
        (preset.rules.find(x => x.id == 15) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 15) as Rule).changeableType = false;
        (preset.rules.find(x => x.id == 16) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 16) as Rule).changeableType = false;
        (preset.rules.find(x => x.id == 17) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 17) as Rule).changeableType = false;
        (preset.rules.find(x => x.id == 18) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 18) as Rule).changeableType = false;
        (preset.rules.find(x => x.id == 19) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 19) as Rule).changeableType = false;
        (preset.rules.find(x => x.id == 20) as Rule).type = Rule.RestrictionType();
        (preset.rules.find(x => x.id == 20) as Rule).changeableType = false;
        return preset;
    }

    public static FullCustomRando(): Preset {
        const preset: Preset = new Preset("Custom", "Fully customizable randomizer (all settings & rules modifiable).");

        (preset.rules.find(x => x.id == 2) as Rule).changeableType = true;
        (preset.rules.find(x => x.id == 2) as Rule).hidden = false;
        (preset.rules.find(x => x.id == 3) as Rule).changeableType = true;
        (preset.rules.find(x => x.id == 3) as Rule).hidden = false;
        (preset.rules.find(x => x.id == 4) as Rule).hidden = false;

        return preset;
    }

    public static HundoRando(): Preset {
        const preset: Preset = new Preset("All Cells", "Estimated time: unknown");
        preset.randomizer.cellsInRun = 101;
        preset.randomizer.cellsShownInAdvance = 100;
        preset.randomizer.endAtFinalBoss = true;
        preset.randomizer.sameLevelPercent = 75;
        preset.randomizer.sameLevelPercentOrbCells = 60;
        preset.randomizer.sameHubPercent = 65;
        preset.lockLevel = 2;
        return preset;
    }

    public static ListPresets(): Preset[] {
        return [ 
            Preset.FiddyCellRando(),
            Preset.SeventyTwoCellRando(),
            Preset.ClassicRando(),
            Preset.FullCustomRando(),
            Preset.HundoRando()
        ]
    }
}