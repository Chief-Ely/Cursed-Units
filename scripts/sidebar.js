// ==========================================
// Nuclear Explosion Weapon Factory
// ==========================================
function createSelfDestructWeapon(weaponName, damage, radius) {
    var wave = new WaveEffect();
    wave.lifetime = 10;
    wave.strokeTo = 20;
    wave.sizeTo = 70;

    var explosionEffect = new MultiEffect(Fx.reactorExplosion, wave);

    var explosion = new BulletType();
    explosion.collides = false;
    explosion.collidesTiles = false;
    explosion.collidesAir = true;
    explosion.collidesGround = true;
    explosion.hitSound = Sounds.explosion;
    explosion.instantDisappear = true;
    explosion.killShooter = true; // Kills unit on fire
    explosion.despawnHit = true;
    explosion.splashDamage = damage || 10000;
    explosion.splashDamageRadius = radius || 200;
    explosion.hitEffect = explosionEffect;

    var selfDestruct = new Weapon(weaponName || "self-destruct");
    selfDestruct.shootOnDeath = true;
    selfDestruct.reload = 10;        // Allows AI to target & fire
    selfDestruct.mirror = false;
    selfDestruct.shootCone = 180;
    selfDestruct.x = 0;
    selfDestruct.shootY = 0;
    selfDestruct.ejectEffect = Fx.none;
    selfDestruct.shootSound = Sounds.explosion;
    selfDestruct.bullet = explosion;
    selfDestruct.load();

    return selfDestruct;
}

// Helper function to apply target unit type's weapons and abilities to player unit
function applyWeaponsAndAbilities(targetUnitType) {
    var playerUnit = Vars.player ? Vars.player.unit() : null;
    if (!playerUnit || !targetUnitType) return;

    // 1. Copy Weapons
    playerUnit.setupWeapons(targetUnitType);

    // 2. Copy Abilities
    var abilitiesSeq = new Seq();
    targetUnitType.abilities.each(a => abilitiesSeq.add(a));
    playerUnit.abilities = abilitiesSeq.toArray(Packages.mindustry.entities.abilities.Ability);
}

// Helper function to safely spawn a modified nuclear unit instance next to the player
function spawnNukeUnit(baseType, weaponName, damage, radius, applyBuffs) {
    var player = Vars.player;
    if (!player || !player.unit()) return;

    var unit = baseType.create(player.team());
    unit.set(player.x + 20, player.y + 20);

    var nukeWeapon = createSelfDestructWeapon(weaponName, damage, radius);
    unit.mounts[0] = new WeaponMount(nukeWeapon);

    if (applyBuffs) {
        var abilitiesSeq = new Seq();
        UnitTypes.oct.abilities.each(a => abilitiesSeq.add(a));
        UnitTypes.aegires.abilities.each(a => abilitiesSeq.add(a));
        unit.abilities = abilitiesSeq.toArray(Packages.mindustry.entities.abilities.Ability);
    }

    unit.add();

    // Force explosion upon touching/colliding with enemy structures (like the Core) or units
    Timer.schedule(() => {
        if (!unit.isAdded() || unit.dead) return;

        var tile = Vars.world.tileWorld(unit.x, unit.y);
        if (tile && tile.build && tile.build.team != unit.team) {
            unit.kill(); // Trigger shootOnDeath nuclear blast!
        }
    }, 0, 0.1);
}

// Helper function to safely spawn a Crawler with Reign weapons + ranged AI
function spawnReignCrawler() {
    var player = Vars.player;
    if (!player || !player.unit()) return;

    var unit = UnitTypes.crawler.create(player.team());
    unit.set(player.x + 20, player.y + 20);
    unit.setupWeapons(UnitTypes.reign);
    unit.controller(new GroundAI());
    unit.add();
}

// Helper function to spawn a Reign with Aegires status/heal field abilities
function spawnReigires() {
    var player = Vars.player;
    if (!player || !player.unit()) return;

    var unit = UnitTypes.reign.create(player.team());
    unit.set(player.x + 20, player.y + 20);

    var abilitiesSeq = new Seq();
    UnitTypes.aegires.abilities.each(a => abilitiesSeq.add(a));
    unit.abilities = abilitiesSeq.toArray(Packages.mindustry.entities.abilities.Ability);

    unit.add();
}

// Helper function to spawn B2 Bomber (Quad dropping nuclear bombs)
function spawnB2Bomber() {
    var player = Vars.player;
    if (!player || !player.unit()) return;

    var wave = new WaveEffect();
    wave.lifetime = 15;
    wave.strokeTo = 25;
    wave.sizeTo = 110;

    var explosionEffect = new MultiEffect(Fx.reactorExplosion, wave);

    var baseBomb = UnitTypes.quad.weapons.get(0).bullet;
    var nukeBomb = baseBomb.copy();
    nukeBomb.hitSound = Sounds.explosion;
    nukeBomb.despawnHit = true;
    nukeBomb.splashDamage = 10000;
    nukeBomb.splashDamageRadius = 140;
    nukeBomb.hitEffect = explosionEffect;
    nukeBomb.despawnEffect = explosionEffect;

    var baseWeapon = UnitTypes.quad.weapons.get(0);
    var nukeDrop = new Weapon("quad-nuke-drop");
    nukeDrop.reload = 180; // 3 seconds
    nukeDrop.x = baseWeapon.x;
    nukeDrop.y = baseWeapon.y;
    nukeDrop.shootSound = baseWeapon.shootSound;
    nukeDrop.bullet = nukeBomb;
    nukeDrop.load();

    var quad = UnitTypes.quad.create(player.team());
    quad.set(player.x + 20, player.y + 20);
    quad.mounts[0] = new WeaponMount(nukeDrop);
    quad.add();
}

// Helper function to spawn Star Destroyer (Oct + Eclipse Weapons + Aegires Abilities + Flying AI)
function spawnStarDestroyer() {
    var player = Vars.player;
    if (!player || !player.unit()) return;

    var oct = UnitTypes.oct.create(player.team());
    oct.set(player.x + 20, player.y + 20);
    oct.setupWeapons(UnitTypes.eclipse);

    var abilitiesSeq = new Seq();
    UnitTypes.aegires.abilities.each(a => abilitiesSeq.add(a));
    oct.abilities = abilitiesSeq.toArray(Packages.mindustry.entities.abilities.Ability);

    oct.controller(new FlyingAI());
    oct.add();
}

// Helper function to spawn Solar (Eclipse + Default Weapons + Sei Weapons + Toxopid Weapons)
function spawnSolar() {
    var player = Vars.player;
    if (!player || !player.unit()) return;

    var unit = UnitTypes.eclipse.create(player.team());
    unit.set(player.x + 20, player.y + 20);

    var allMounts = [];
    unit.mounts.forEach(m => allMounts.push(m));
    
    // Add Sei weapons
    UnitTypes.sei.weapons.each(w => {
        allMounts.push(new WeaponMount(w));
    });

    // Add Toxopid weapons
    UnitTypes.toxopid.weapons.each(w => {
        allMounts.push(new WeaponMount(w));
    });

    unit.mounts = allMounts;
    unit.add();
}

// Helper function to spawn Destroyer (Toxopid + Navanax Weapons/Abilities + Scepter Weapons/Abilities)
function spawnDestroyer() {
    var player = Vars.player;
    if (!player || !player.unit()) return;

    var unit = UnitTypes.toxopid.create(player.team());
    unit.set(player.x + 20, player.y + 20);

    var allMounts = [];
    unit.mounts.forEach(m => allMounts.push(m));

    // Append Navanax weapons
    UnitTypes.navanax.weapons.each(w => {
        allMounts.push(new WeaponMount(w));
    });

    // Append Scepter weapons
    UnitTypes.scepter.weapons.each(w => {
        allMounts.push(new WeaponMount(w));
    });

    unit.mounts = allMounts;

    // Combine Toxopid, Navanax, and Scepter abilities
    var abilitiesSeq = new Seq();
    UnitTypes.toxopid.abilities.each(a => abilitiesSeq.add(a));
    UnitTypes.navanax.abilities.each(a => abilitiesSeq.add(a));
    UnitTypes.scepter.abilities.each(a => abilitiesSeq.add(a));

    unit.abilities = abilitiesSeq.toArray(Packages.mindustry.entities.abilities.Ability);

    unit.add();
}

// Helper function to kill active units
function killUnitsByTeam(targetTeam) {
    Groups.unit.each(u => {
        if (targetTeam === null || u.team === targetTeam) {
            u.kill();
        }
    });
}

// Helper functions for inventory filling
function fillCore() {
    var core = Vars.player ? Vars.player.team().core() : null;
    if (!core) return;

    // Dynamically retrieve the core's maximum storage capacity
    var maxCap = core.storageCapacity || (core.block ? core.block.itemCapacity : 8000);

    [Items.copper, Items.lead, Items.metaglass, Items.graphite, Items.silicon, Items.coal, Items.sand, Items.titanium, Items.thorium, Items.plastanium, Items.phaseFabric, Items.surgeAlloy, Items.blastCompound].forEach(item => {
        core.items.set(item, maxCap);
    });
}

function fillInterAll() {
    Vars.world.tiles.eachTile(t => {
        if (t.build && t.build.block == Blocks.interplanetaryAccelerator) {
            [Items.copper, Items.lead, Items.metaglass, Items.graphite, Items.silicon, Items.coal, Items.sand, Items.titanium, Items.thorium, Items.plastanium, Items.phaseFabric, Items.surgeAlloy, Items.blastCompound].forEach(item => t.build.items.set(item, 13000));
        }
    });
}

function fillInterReq() {
    Vars.world.tiles.eachTile(t => {
        if (t.build && t.build.block == Blocks.interplanetaryAccelerator) {
            t.build.items.set(Items.copper, 8000);
            t.build.items.set(Items.lead, 8000);
            t.build.items.set(Items.silicon, 5000);
            t.build.items.set(Items.thorium, 13000);
        }
    });
}

// Helper function to create left-aligned buttons
function createLeftBtn(table, text, width, height, onClick) {
    var cell = table.button(text, Styles.cleart, onClick).width(width).height(height);
    var btn = cell.get();
    btn.getLabel().setAlignment(Align.left);
    return cell;
}

// ==========================================
// Sidebar UI Class
// ==========================================
var sidebar = {
    isOpen: false,
    showWeaponsGroup: false,
    showNuclearGroup: false,
    showSerpuloGroup: false,
    showErekirGroup: false,
    showTeamsGroup: false,
    showKillGroup: false,
    showFillGroup: false,
    container: null,

    build: function() {
        var self = this;

        this.container = new Table();
        this.container.name = "custom-sidebar";
        this.container.setFillParent(true);
        this.container.left().top();
        this.container.marginTop(100);

        this.rebuild();
        Vars.ui.hudGroup.addChild(this.container);
    },

    rebuild: function() {
        var self = this;
        this.container.clearChildren();

        if (this.isOpen) {
            var panel = new Table(Styles.black6);
            panel.left().top();
            panel.margin(16);

            var titleCell = panel.add("MENU").color(Pal.accent).left();
            titleCell.padBottom(12);
            panel.row();

            // ==========================================
            // MAIN GROUP 1: "Use Weapons & Abilities"
            // ==========================================
            var groupBtnText = (this.showWeaponsGroup ? "v " : "> ") + "Use Weapons & Abilities";
            var groupBtn = createLeftBtn(panel, groupBtnText, 240, 45, function() {
                self.showWeaponsGroup = !self.showWeaponsGroup;
                self.rebuild();
            });
            groupBtn.padBottom(6);
            panel.row();

            // --- WEAPONS & ABILITIES SUB-CONTENT ---
            if (this.showWeaponsGroup) {
                var weaponsTable = new Table();
                weaponsTable.left();
                weaponsTable.margin(0, 10, 0, 0);

                // --- SUB-GROUP 1: Serpulo ---
                var serpuloText = (this.showSerpuloGroup ? "  v " : "  > ") + "Serpulo";
                var serpuloBtn = createLeftBtn(weaponsTable, serpuloText, 220, 40, function() {
                    self.showSerpuloGroup = !self.showSerpuloGroup;
                    self.rebuild();
                });
                serpuloBtn.padBottom(4);
                weaponsTable.row();

                if (this.showSerpuloGroup) {
                    var serpuloTable = new Table();
                    serpuloTable.left();
                    serpuloTable.margin(0, 14, 0, 0);

                    var serpuloUnits = [
                        { name: "Dagger", type: UnitTypes.dagger },
                        { name: "Mace", type: UnitTypes.mace },
                        { name: "Fortress", type: UnitTypes.fortress },
                        { name: "Scepter", type: UnitTypes.scepter },
                        { name: "Reign", type: UnitTypes.reign },

                        { name: "Nova", type: UnitTypes.nova },
                        { name: "Pulsar", type: UnitTypes.pulsar },
                        { name: "Quasar", type: UnitTypes.quasar },
                        { name: "Vela", type: UnitTypes.vela },
                        { name: "Corvus", type: UnitTypes.corvus },

                        { name: "Atrax", type: UnitTypes.atrax },
                        { name: "Spiroct", type: UnitTypes.spiroct },
                        { name: "Arkyid", type: UnitTypes.arkyid },
                        { name: "Toxopid", type: UnitTypes.toxopid },

                        { name: "Flare", type: UnitTypes.flare },
                        { name: "Horizon", type: UnitTypes.horizon },
                        { name: "Zenith", type: UnitTypes.zenith },
                        { name: "Antumbra", type: UnitTypes.antumbra },
                        { name: "Eclipse", type: UnitTypes.eclipse },

                        { name: "Poly", type: UnitTypes.poly },
                        { name: "Mega", type: UnitTypes.mega },
                        { name: "Quad", type: UnitTypes.quad },
                        { name: "Oct", type: UnitTypes.oct },

                        { name: "Risso", type: UnitTypes.risso },
                        { name: "Minke", type: UnitTypes.minke },
                        { name: "Bryde", type: UnitTypes.bryde },
                        { name: "Sei", type: UnitTypes.sei },
                        { name: "Omura", type: UnitTypes.omura },

                        { name: "Retusa", type: UnitTypes.retusa },
                        { name: "Oxynoe", type: UnitTypes.oxynoe },
                        { name: "Cyrus", type: UnitTypes.cyerce },
                        { name: "Aegires", type: UnitTypes.aegires },
                        { name: "Navanax", type: UnitTypes.navanax }
                    ];

                    serpuloUnits.forEach(function(u) {
                        var uBtn = createLeftBtn(serpuloTable, "- " + u.name, 190, 35, function() {
                            applyWeaponsAndAbilities(u.type);
                        });
                        uBtn.padBottom(3);
                        serpuloTable.row();
                    });

                    weaponsTable.add(serpuloTable).left().padBottom(6).row();
                }

                // --- SUB-GROUP 2: Erekir ---
                var erekirText = (this.showErekirGroup ? "  v " : "  > ") + "Erekir";
                var erekirBtn = createLeftBtn(weaponsTable, erekirText, 220, 40, function() {
                    self.showErekirGroup = !self.showErekirGroup;
                    self.rebuild();
                });
                erekirBtn.padBottom(4);
                weaponsTable.row();

                if (this.showErekirGroup) {
                    var erekirTable = new Table();
                    erekirTable.left();
                    erekirTable.margin(0, 14, 0, 0);

                    var erekirUnits = [
                        { name: "Stell", type: UnitTypes.stell },
                        { name: "Locus", type: UnitTypes.locus },
                        { name: "Precept", type: UnitTypes.precept },
                        { name: "Vanquish", type: UnitTypes.vanquish },
                        { name: "Conquer", type: UnitTypes.conquer },

                        { name: "Merui", type: UnitTypes.merui },
                        { name: "Cleroi", type: UnitTypes.cleroi },
                        { name: "Anthicus", type: UnitTypes.anthicus },
                        { name: "Tecta", type: UnitTypes.tecta },
                        { name: "Colossus", type: UnitTypes.collaris },

                        { name: "Elude", type: UnitTypes.elude },
                        { name: "Avert", type: UnitTypes.avert },
                        { name: "Obviate", type: UnitTypes.obviate },
                        { name: "Quell", type: UnitTypes.quell },
                        { name: "Disrupt", type: UnitTypes.disrupt }
                    ];

                    erekirUnits.forEach(function(u) {
                        var uBtn = createLeftBtn(erekirTable, "- " + u.name, 190, 35, function() {
                            applyWeaponsAndAbilities(u.type);
                        });
                        uBtn.padBottom(3);
                        erekirTable.row();
                    });

                    weaponsTable.add(erekirTable).left().padBottom(6).row();
                }

                panel.add(weaponsTable).left().padBottom(8).row();
            }

            // ==========================================
            // MAIN GROUP 2: "Spawn Nuclear Units"
            // ==========================================
            var nuclearBtnText = (this.showNuclearGroup ? "v " : "> ") + "Spawn Nuclear Units";
            var nuclearBtn = createLeftBtn(panel, nuclearBtnText, 240, 45, function() {
                self.showNuclearGroup = !self.showNuclearGroup;
                self.rebuild();
            });
            nuclearBtn.padBottom(6);
            panel.row();

            if (this.showNuclearGroup) {
                var nuclearTable = new Table();
                nuclearTable.left();
                nuclearTable.margin(0, 10, 0, 0);

                var crawlerBtn = createLeftBtn(nuclearTable, "- Nuke Crawler", 210, 35, function() {
                    spawnNukeUnit(UnitTypes.crawler, "crawler-nuke", 10000, 100, false);
                });
                crawlerBtn.padBottom(3);
                nuclearTable.row();

                var buffedCrawlerBtn = createLeftBtn(nuclearTable, "- Buffed Nuke Crawler", 210, 35, function() {
                    spawnNukeUnit(UnitTypes.crawler, "crawler-buffed-nuke", 10000, 120, true);
                });
                buffedCrawlerBtn.padBottom(3);
                nuclearTable.row();

                var kamikazeBtn = createLeftBtn(nuclearTable, "- Kamikaze", 210, 35, function() {
                    spawnNukeUnit(UnitTypes.horizon, "horizon-nuke", 10000, 120, false);
                });
                kamikazeBtn.padBottom(3);
                nuclearTable.row();

                var reignCrawlerBtn = createLeftBtn(nuclearTable, "- Reign Crawler", 210, 35, function() {
                    spawnReignCrawler();
                });
                reignCrawlerBtn.padBottom(3);
                nuclearTable.row();

                var reigiresBtn = createLeftBtn(nuclearTable, "- Reigires", 210, 35, function() {
                    spawnReigires();
                });
                reigiresBtn.padBottom(3);
                nuclearTable.row();

                var b2BomberBtn = createLeftBtn(nuclearTable, "- B2 Bomber", 210, 35, function() {
                    spawnB2Bomber();
                });
                b2BomberBtn.padBottom(3);
                nuclearTable.row();

                var starDestroyerBtn = createLeftBtn(nuclearTable, "- Star Destroyer", 210, 35, function() {
                    spawnStarDestroyer();
                });
                starDestroyerBtn.padBottom(3);
                nuclearTable.row();

                var solarBtn = createLeftBtn(nuclearTable, "- Solar", 210, 35, function() {
                    spawnSolar();
                });
                solarBtn.padBottom(3);
                nuclearTable.row();

                var destroyerBtn = createLeftBtn(nuclearTable, "- Destroyer", 210, 35, function() {
                    spawnDestroyer();
                });
                destroyerBtn.padBottom(3);
                nuclearTable.row();

                panel.add(nuclearTable).left().padBottom(8).row();
            }

            // ==========================================
            // MAIN GROUP 3: "Fill Inventory"
            // ==========================================
            var fillBtnText = (this.showFillGroup ? "v " : "> ") + "Fill Inventory";
            var fillBtn = createLeftBtn(panel, fillBtnText, 240, 45, function() {
                self.showFillGroup = !self.showFillGroup;
                self.rebuild();
            });
            fillBtn.padBottom(6);
            panel.row();

            if (this.showFillGroup) {
                var fillTable = new Table();
                fillTable.left();
                fillTable.margin(0, 10, 0, 0);

                var fillCoreBtn = createLeftBtn(fillTable, "- Fill Core", 210, 35, function() {
                    fillCore();
                });
                fillCoreBtn.padBottom(3);
                fillTable.row();

                var fillInterAllBtn = createLeftBtn(fillTable, "- Fill Inter All", 210, 35, function() {
                    fillInterAll();
                });
                fillInterAllBtn.padBottom(3);
                fillTable.row();

                var fillInterReqBtn = createLeftBtn(fillTable, "- Fill Inter Req", 210, 35, function() {
                    fillInterReq();
                });
                fillInterReqBtn.padBottom(3);
                fillTable.row();

                panel.add(fillTable).left().padBottom(8).row();
            }

            // ==========================================
            // MAIN GROUP 4: "Change Teams"
            // ==========================================
            var teamsBtnText = (this.showTeamsGroup ? "v " : "> ") + "Change Teams";
            var teamsBtn = createLeftBtn(panel, teamsBtnText, 240, 45, function() {
                self.showTeamsGroup = !self.showTeamsGroup;
                self.rebuild();
            });
            teamsBtn.padBottom(6);
            panel.row();

            if (this.showTeamsGroup) {
                var teamsTable = new Table();
                teamsTable.left();
                teamsTable.margin(0, 10, 0, 0);

                var teams = [
                    { name: "Derelict", team: Team.derelict },
                    { name: "Sharded (Yellow)", team: Team.sharded },
                    { name: "Crux (Red)", team: Team.crux },
                    { name: "Malis (Purple)", team: Team.malis },
                    { name: "Green", team: Team.green },
                    { name: "Blue", team: Team.blue }
                ];

                teams.forEach(function(t) {
                    var tBtn = createLeftBtn(teamsTable, "- " + t.name, 210, 35, function() {
                        if (Vars.player) {
                            Vars.player.team(t.team);
                            if (Vars.player.unit()) {
                                Vars.player.unit().team = t.team;
                            }
                        }
                    });
                    tBtn.padBottom(3);
                    teamsTable.row();
                });

                panel.add(teamsTable).left().padBottom(8).row();
            }

            // ==========================================
            // MAIN GROUP 5: "Kill Units"
            // ==========================================
            var killBtnText = (this.showKillGroup ? "v " : "> ") + "Kill Units";
            var killBtn = createLeftBtn(panel, killBtnText, 240, 45, function() {
                self.showKillGroup = !self.showKillGroup;
                self.rebuild();
            });
            killBtn.padBottom(6);
            panel.row();

            if (this.showKillGroup) {
                var killTable = new Table();
                killTable.left();
                killTable.margin(0, 10, 0, 0);

                var killAllBtn = createLeftBtn(killTable, "- All Units", 210, 35, function() {
                    killUnitsByTeam(null);
                });
                killAllBtn.padBottom(3);
                killTable.row();

                var killTeams = [
                    { name: "My Team", team: function() { return Vars.player ? Vars.player.team() : null; } },
                    { name: "Derelict", team: function() { return Team.derelict; } },
                    { name: "Sharded (Yellow)", team: function() { return Team.sharded; } },
                    { name: "Crux (Red)", team: function() { return Team.crux; } },
                    { name: "Malis (Purple)", team: function() { return Team.malis; } },
                    { name: "Green", team: function() { return Team.green; } },
                    { name: "Blue", team: function() { return Team.blue; } }
                ];

                killTeams.forEach(function(kt) {
                    var ktBtn = createLeftBtn(killTable, "- " + kt.name, 210, 35, function() {
                        var target = kt.team();
                        if (target) killUnitsByTeam(target);
                    });
                    ktBtn.padBottom(3);
                    killTable.row();
                });

                panel.add(killTable).left().padBottom(8).row();
            }

            // Scrollable Container
            var pane = new ScrollPane(panel);
            this.container.add(pane).growY();
        }

        // --- TOGGLE TAB BUTTON ---
        var toggleBtn = new TextButton(this.isOpen ? " < " : " > ", Styles.cleart);
        toggleBtn.clicked(function() {
            self.isOpen = !self.isOpen;
            self.rebuild();
        });

        this.container.add(toggleBtn).width(35).height(50).top();
    }
};

// Safe mounting on launch or live reload
if (Vars.ui && Vars.ui.hudGroup) {
    sidebar.build();
} else {
    Events.on(ClientLoadEvent, function() {
        sidebar.build();
    });
}