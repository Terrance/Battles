var signals = {
    WaitForPlayer: function WaitForPlayer() {},
    EnemyNoHealth: function EnemyNoHealth(enemy) {
        this.enemy = enemy;
    },
    NoMoreEnemies: function NoMoreEnemies() {},
    PlayerNoHealth: function PlayerNoHealth() {}
};

var stage = new Stage(new Player());

$(document).ready(function documentReady() {
    function initBattle() {
        for (var i in stage.enemies) {
            // add health bar
            var enemy = stage.enemies[i];
            var progress = $("<div/>").addClass("progress").data("enemy", enemy);
            progress.append($("<div/>").addClass("prog-on progress-bar progress-bar-success").css("width", "100%"));
            progress.append($("<div/>").addClass("prog-off progress-bar progress-bar-danger").css("width", "0%"));
            progress.append($("<span/>").html(enemy.name + " (" + enemy.healthPoints + " / " + enemy.maxHealth + ")"));
            $("#enemyList").append(progress);
            // add stage entity
            var img = $("<img/>").addClass("img-rounded").attr("src", enemy.image).data("enemy", enemy);
            img.tooltip({
                placement: "bottom",
                title: enemy.tooltip
            });
            $("#battleEnemies").append(img);
        }
    }
    function updateAll() {
        updateProgress($("#playerHP"), "HP", stage.player.healthPoints, stage.player.maxHealth);
        updateProgress($("#playerBP"), "BP", stage.player.battlePoints, stage.player.maxBattle);
        updateProgress($("#playerSP"), "SP", stage.player.specialPoints, stage.player.maxSpecial);
        updateProgress($("#playerLevel"), "Level " + stage.player.level, stage.player.levelPoints, 100);
        $("#enemyList .progress").each(function(index, progress) {
            var enemy = $(progress).data("enemy");
            updateProgress($(progress), enemy.name, enemy.healthPoints, enemy.maxHealth);
        });
    }
    function updateProgress(bar, msg, curr, max) {
        var percent = 100 * (curr / max);
        if (max === 0) {
            bar.addClass("progress-greyed");
        } else {
            bar.removeClass("progress-greyed");
        }
        $(".prog-on", bar).css("width", percent + "%");
        $(".prog-off", bar).css("width", (100 - percent) + "%");
        $("span", bar).html(msg + " (" + curr + " / " + max + ")");
    }
    var battleControlTypes = {
        jump: 1,
        hammer: 2
    };
    function addBattleControls(type) {
        $("#battlePlayer").fadeTo("fast", 0.5);
        switch (type) {
            case battleControlTypes.jump:
                $("#battleEnemies img").each(function(index, image) {
                    var enemy = $(image).data("enemy");
                    if (enemy.healthPoints) {
                        if (enemy.flying === 0 || enemy.flying === 1 || enemy.flying === 2) {
                            $(image).css("cursor", "pointer").on("click", function(e) {
                                clearBattleControls();
                                hidePlayerTurnPanel();
                                playerJumpAttack(enemy);
                            });
                        } else {
                            $(image).fadeTo("fast", 0.5);
                        }
                    }
                });
                break;
            case battleControlTypes.hammer:
                var done = false;
                $("#battleEnemies img").each(function(index, image) {
                    var enemy = $(image).data("enemy");
                    if (enemy.healthPoints) {
                        if (done) {
                            $(image).fadeTo("fast", 0.5);
                        } else {
                            if (enemy.flying === 0 || enemy.flying === 1) {
                                $(image).css("cursor", "pointer").on("click", function(e) {
                                    clearBattleControls();
                                    hidePlayerTurnPanel();
                                    playerHammerAttack(enemy);
                                });
                                done = true;
                            } else {
                                $(image).fadeTo("fast", 0.5);
                            }
                        }
                    }
                });
                break;
        }
    }
    function clearBattleControls() {
        $("#battlePlayer").off("click").css("cursor", "").fadeTo("fast", 1);
        $("#battleEnemies img").each(function(index, image) {
            var enemy = $(image).data("enemy");
            if (enemy.healthPoints) {
                $(image).off("click").css("cursor", "").fadeTo("fast", 1);
            }
        });
    }
    function hidePlayerTurnPanel() {
        $("#playerTurnPanel").fadeOut("fast", function postPlayerTurnFadeOut(e) {
            $("#playerTurnJumpMenu").hide();
            $("#playerTurnHammerMenu").hide();
            $("#playerTurnMainMenu").show();
        });
    }
    function playerJumpAttack(target) {
        try {
            stage.player.jumpAttack(target);
        } catch (e) {
            checkEnemyHealth(e);
        }
        playTurns();
    }
    function playerHammerAttack(target) {
        try {
            stage.player.hammerAttack(target);
        } catch (e) {
            checkEnemyHealth(e);
        }
        playTurns();
    }
    function checkEnemyHealth(e) {
        if (e instanceof signals.EnemyNoHealth) {
            $("#battleEnemies img").each(function(index, image) {
                var enemy = $(image).data("enemy");
                if (enemy === e.enemy) {
                    $(image).fadeOut("fast");
                }
            });
        } else {
            throw e;
        }
    }
    $("#playerTurnJump").on("click", function playerTurnJumpOnClick(e) {
        $("#playerTurnMainMenu").hide();
        $("#playerTurnJumpMenu").fadeIn("fast");
        addBattleControls(battleControlTypes.jump);
    });
    $("#playerTurnJumpBack").on("click", function playerTurnJumpBackOnClick(e) {
        clearBattleControls();
        $("#playerTurnJumpMenu").hide();
        $("#playerTurnMainMenu").fadeIn("fast");
    });
    $("#playerTurnHammer").on("click", function playerTurnHammerOnClick(e) {
        $("#playerTurnMainMenu").hide();
        $("#playerTurnHammerMenu").fadeIn("fast");
        addBattleControls(battleControlTypes.hammer);
    });
    $("#playerTurnHammerBack").on("click", function playerTurnHammerBackOnClick(e) {
        clearBattleControls();
        $("#playerTurnHammerMenu").hide();
        $("#playerTurnMainMenu").fadeIn("fast");
    });
    function playTurns() {
        try {
            updateAll();
            stage.setNext();
            stage.nextToPlay.playTurn();
            setTimeout(playTurns, 1000);
        } catch (e) {
            if (e instanceof signals.WaitForPlayer) {
                $("#playerTurnPanel").fadeIn();
            } else if (e instanceof signals.NoMoreEnemies) {
                updateAll();
                $("#battlePanel").hide();
                $("#gameOverPanel").fadeIn();
                $("#gameOverPanel span").html("You win!");
            } else if (e instanceof signals.PlayerNoHealth) {
                updateAll();
                $("#battlePanel").hide();
                $("#gameOverPanel").fadeIn();
                $("#gameOverPanel span").html("You lose...");
            } else {
                throw e;
            }
        }
    }
    stage.enemies = [new Goomba, new Goomba, new KoopaTroopa];
    initBattle();
    playTurns();
});
