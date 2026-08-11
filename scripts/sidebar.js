// ==========================================
// Nuclear Explosion Weapon Factory
// ==========================================
function createSelfDestructWeapon(weaponName, damage, radius) {
    var wave = new WaveEffect();
    wave.lifetime = 10;
    wave.strokeTo = 20;
    wave.sizeTo = 90;

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
    explosion.splashDamageRadius = radius || 100;
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

// Helper function to kill active units
function killUnitsByTeam(targetTeam) {
    Groups.unit.each(u => {
        if (targetTeam === null || u.team === targetTeam) {
            u.kill();
        }
    });
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

            var titleCell = panel.add("MENU").color(Pal.accent);
            titleCell.padBottom(12);
            panel.row();

            // ==========================================
            // MAIN GROUP 1: "Use Unit Weapons"
            // ==========================================
            var groupBtnText = (this.showWeaponsGroup ? "v " : "> ") + "Use Unit Weapons";
            var groupBtn = panel.button(groupBtnText, Styles.cleart, function() {
                self.showWeaponsGroup = !self.showWeaponsGroup;
                self.rebuild();
            }).width(240).height(45);
            groupBtn.padBottom(6);
            panel.row();

            // --- WEAPONS SUB-CONTENT ---
            if (this.showWeaponsGroup) {
                var weaponsTable = new Table();
                weaponsTable.left();
                weaponsTable.margin(0, 10, 0, 0);

                // --------------------------------------
                // SUB-GROUP 1: Serpulo
                // --------------------------------------
                var serpuloText = (this.showSerpuloGroup ? "  v " : "  > ") + "Serpulo";
                var serpuloBtn = weaponsTable.button(serpuloText, Styles.cleart, function() {
                    self.showSerpuloGroup = !self.showSerpuloGroup;
                    self.rebuild();
                }).width(220).height(40);
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

                        { name: "Risso", type: UnitTypes.risso },
                        { name: "Minke", type: UnitTypes.minke },
                        { name: "Bryde", type: UnitTypes.bryde },
                        { name: "Sei", type: UnitTypes.sei },
                        { name: "Omura", type: UnitTypes.omura },

                        { name: "Retusa", type: UnitTypes.retusa },
                        { name: "Oxynoe", type: UnitTypes.oxynoe },
                        { name: "Cyrus", type: UnitTypes.cyerce },
                        { name: "Navanax", type: UnitTypes.navanax }
                    ];

                    serpuloUnits.forEach(function(u) {
                        var uBtn = serpuloTable.button("- " + u.name, Styles.cleart, function() {
                            if (Vars.player.unit() && u.type) {
                                Vars.player.unit().setupWeapons(u.type);
                            }
                        }).width(190).height(35);
                        uBtn.padBottom(3);
                        serpuloTable.row();
                    });

                    weaponsTable.add(serpuloTable).left().padBottom(6).row();
                }

                // --------------------------------------
                // SUB-GROUP 2: Erekir
                // --------------------------------------
                var erekirText = (this.showErekirGroup ? "  v " : "  > ") + "Erekir";
                var erekirBtn = weaponsTable.button(erekirText, Styles.cleart, function() {
                    self.showErekirGroup = !self.showErekirGroup;
                    self.rebuild();
                }).width(220).height(40);
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
                        var uBtn = erekirTable.button("- " + u.name, Styles.cleart, function() {
                            if (Vars.player.unit() && u.type) {
                                Vars.player.unit().setupWeapons(u.type);
                            }
                        }).width(190).height(35);
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
            var nuclearBtn = panel.button(nuclearBtnText, Styles.cleart, function() {
                self.showNuclearGroup = !self.showNuclearGroup;
                self.rebuild();
            }).width(240).height(45);
            nuclearBtn.padBottom(6);
            panel.row();

            if (this.showNuclearGroup) {
                var nuclearTable = new Table();
                nuclearTable.left();
                nuclearTable.margin(0, 10, 0, 0);

                // --- Standard Nuke Crawler ---
                var crawlerBtn = nuclearTable.button("- Nuke Crawler", Styles.cleart, function() {
                    spawnNukeUnit(UnitTypes.crawler, "crawler-nuke", 10000, 100, false);
                }).width(210).height(35);
                crawlerBtn.padBottom(3);
                nuclearTable.row();

                // --- Buffed Nuke Crawler (Oct Shield + Aegires Fields) ---
                var buffedCrawlerBtn = nuclearTable.button("- Buffed Nuke Crawler", Styles.cleart, function() {
                    spawnNukeUnit(UnitTypes.crawler, "crawler-buffed-nuke", 10000, 120, true);
                }).width(210).height(35);
                buffedCrawlerBtn.padBottom(3);
                nuclearTable.row();

                // --- Nuke Horizon ---
                var horizonBtn = nuclearTable.button("- Nuke Horizon", Styles.cleart, function() {
                    spawnNukeUnit(UnitTypes.horizon, "horizon-nuke", 10000, 120, false);
                }).width(210).height(35);
                horizonBtn.padBottom(3);
                nuclearTable.row();

                // --- Reign Crawler ---
                var reignCrawlerBtn = nuclearTable.button("- Reign Crawler", Styles.cleart, function() {
                    spawnReignCrawler();
                }).width(210).height(35);
                reignCrawlerBtn.padBottom(3);
                nuclearTable.row();

                // --- Reigires ---
                var reigiresBtn = nuclearTable.button("- Reigires", Styles.cleart, function() {
                    spawnReigires();
                }).width(210).height(35);
                reigiresBtn.padBottom(3);
                nuclearTable.row();

                panel.add(nuclearTable).left().padBottom(8).row();
            }

            // ==========================================
            // MAIN GROUP 3: "Change Teams"
            // ==========================================
            var teamsBtnText = (this.showTeamsGroup ? "v " : "> ") + "Change Teams";
            var teamsBtn = panel.button(teamsBtnText, Styles.cleart, function() {
                self.showTeamsGroup = !self.showTeamsGroup;
                self.rebuild();
            }).width(240).height(45);
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
                    var tBtn = teamsTable.button("- " + t.name, Styles.cleart, function() {
                        if (Vars.player) {
                            Vars.player.team(t.team);
                            if (Vars.player.unit()) {
                                Vars.player.unit().team = t.team;
                            }
                        }
                    }).width(210).height(35);
                    tBtn.padBottom(3);
                    teamsTable.row();
                });

                panel.add(teamsTable).left().padBottom(8).row();
            }

            // ==========================================
            // MAIN GROUP 4: "Kill Units"
            // ==========================================
            var killBtnText = (this.showKillGroup ? "v " : "> ") + "Kill Units";
            var killBtn = panel.button(killBtnText, Styles.cleart, function() {
                self.showKillGroup = !self.showKillGroup;
                self.rebuild();
            }).width(240).height(45);
            killBtn.padBottom(6);
            panel.row();

            if (this.showKillGroup) {
                var killTable = new Table();
                killTable.left();
                killTable.margin(0, 10, 0, 0);

                // Kill All Units
                var killAllBtn = killTable.button("- All Units", Styles.cleart, function() {
                    killUnitsByTeam(null);
                }).width(210).height(35);
                killAllBtn.padBottom(3);
                killTable.row();

                // Kill By Specific Teams
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
                    var ktBtn = killTable.button("- " + kt.name, Styles.cleart, function() {
                        var target = kt.team();
                        if (target) killUnitsByTeam(target);
                    }).width(210).height(35);
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