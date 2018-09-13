
var tilesbmp;

var jumpkeytime;

var player = {
	x: 320,
	y: 10,
	width: 13,
	height: 23,
	velx: 0,
	vely: 0,
	grounded: false,
	wasgrounded: false,
	score: 0,
	bestscore: 0,
	dir: 1,
	trail: [],
	trailtime: 0,
	xmovecount: 0,
	landedtime: 0
}

var linedef = {
	x1: 0,
	y1: 0,
	x2: 0,
	y2: 0,
	ison: false,
	hasbomb: false,
	bombcount: 0,
	bombpos: 0,
	isoffscreen: true
};


var particles = [];

/*
// old values.
var gamespeed = 1.4;
var timescale = 0.6; // This one seems good.
var enemyspeed = 1.8;
var playerspeed = 4.8;
var jumpvel = -4.5;
var GRAVITY = 0.8;
var HELDGRAVITY = 0.2;
*/

var timescale = 1.0; 
var gamespeed = 1;
var enemyspeed = 0.9;
var playerspeed = 2.9;
var jumpvel = -3.5;
var GRAVITY = 0.46;
var HELDGRAVITY = 0.12;

var lines = [];

var lastlinestandingon = null;
var spanwleveltimer = 0;

var testline = { x1: 0, y1: 0, x2: 0, y2: 0 };

var myfont = null;

var MAINMENU = 0;
var GAME = 1;
var GAMEOVER = 2;

var gamestate = MAINMENU;

var gameovertime = 0;


var linecolor = fixcolor(0x0f8b8d, 255);
var bgcolor = fixcolor(0x95B2B8, 255);
var playercolor = fixcolor(0xa8201a, 255);
var coincolor = fixcolor(0xec9a29, 255);
var enemycolor = linecolor;
var shadowcolor = fixcolor(0x143642, 100);

var bombsize = 14;

var enemysprite;

var textcolor = makecol(0, 0, 0);
var textoutlinecolor = makecol(100, 100, 100);

var gamestarttime;

var jump = jsfxr([0,,0.136,,0.258,0.305,,0.245,,,,,,0.017,,,,,1.000,,,0.140,,0.300]);
var land = jsfxr([3, , 0.097, , 0.190, 0.333, , -0.334, , , , , , , , , , , 1.000, , , , , 0.284]);
var died = jsfxr([3, , 0.208, 0.488, 0.243, 0.470, , -0.316, , , , -0.121, 0.710, , , , 0.399, -0.071, 1.000, , , , , 0.488]);
var newrecordrun = jsfxr([0, , 0.010, , 0.438, 0.414, , 0.310, , , , , , 0.511, , 0.618, , , 1.000, , , , , 0.488]);
var leftside = jsfxr([0, , 0.001, 0.540, 0.158, 0.427, , , , , , , , , , , , , 1.000, , , , , 0.388]);
var rightside = jsfxr([0, 0.005, 0.001, 0.540, 0.158, 0.466, , , -0.019, , , -0.026, , , , , -0.019, -0.006, 1.000, , 0.021, 0.004, -0.019, 0.388]);

function draw() {
	if (gamestate == GAME) {
		drawgamebackground();
		drawgame();
		drawingamegui();
	}
	else if (gamestate == GAMEOVER) {
		drawgameover();
	}
	else {
		drawmainmenu();
	}
}

function drawgame() {

	drawtrail(coincolor, 0, 0);

	var playeranimtime = Math.floor(time() / 100);

	var sourcey = 0;
	if (player.dir < 0) {
		sourcey = 480 - 3 * 32;
	}

	var xanimindex;
	if (player.grounded) {
		xanimindex = (playeranimtime % 6)
	}
	else if (player.vely > 0) {
		xanimindex = player.dir < 0 ? 1 : 3;
		sourcey += 64;
	}
	else {
		xanimindex = player.dir < 0 ? 3 : 1;
		sourcey += 64;
	}

	stretch_blit(tilesbmp, canvas,
		32 * xanimindex, sourcey, 32, 32,
		player.x - 10, player.y - 16, 40, 40);

	for (var i = 0; i < lines.length; i++) {
		var ln = lines[i];
		if (ln == lastlinestandingon ) {
			var perc = (time() - player.landedtime) / 50;
			perc = clamp(1 - perc, 0, 1);
			var linewidth = lerp(4, 16, perc);
			var col = linecolor;
			line(canvas, ln.x1, ln.y1, ln.x2, ln.y2, col, linewidth);
		}
		else if (ln.ison) {
			line(canvas, ln.x1, ln.y1, ln.x2, ln.y2, linecolor, 4);
		}
		else if (time() - ln.offtime < 400) {
			var perc = (time() - ln.offtime) / 400;
			var alpha = (1 - perc) * 255;
			var col = makecol(255, 255, 255, alpha);

			line(canvas, ln.x1, ln.y1, ln.x2, ln.y2, col, 4);
		}

		if (ln.hasbomb) {

			var enemyanimtime = Math.floor(time() / 400);

			var ex = ln.bombpos - 22;
			var ey = lineypos(ln.bombpos, ln) - 20;

			stretch_blit(tilesbmp, canvas,
				32 * (enemyanimtime % 4), 32 * 4, 32, 32,
				ex, ey, 50, 50);
		}
	}

	drawparticles();
}

function drawgamebackground() {

	var xoff = 3;
	var yoff = 3;

	drawtrail(shadowcolor, xoff, yoff);

	for (var i = 0; i < lines.length; i++) {
		var ln = lines[i];
		if (ln.ison) {
			line(canvas, ln.x1 + xoff, ln.y1 + yoff, ln.x2 + xoff, ln.y2 + yoff, shadowcolor, 4);
		}

		if (ln.hasbomb) {
			var ey = lineypos(ln.bombpos, ln);
			circlefill(canvas, ln.bombpos + xoff, ey + yoff, bombsize/*+ rand() % 4*/, shadowcolor);
		}
	}
}

function drawtrail(col, xoff, yoff) {
	for (var i = 0; i < player.trail.length; i++) {
		var t = player.trail[i];
		if (!t.delete) {
			rectfill(canvas, t.x + xoff, t.y + yoff, t.width, t.height, col);
		}
	}
}

function drawingamegui() {
	if (time() - gamestarttime < 5000) {
		textout_centre(canvas, myfont,
			"Click, tap, or press z to jump.",
			SCREEN_W / 2, 80, 24, textoutlinecolor);
		textout_centre(canvas, myfont,
			"Jump to remove lines.",
			SCREEN_W / 2, 120, 24, textoutlinecolor);
	}

	textfuncshadow(textout, canvas, myfont,
		"" + player.score,
		20, 40,
		24,
		textcolor,
		textcolor, 1, shadowcolor);

	textfuncshadow(textout_right, canvas, myfont, "BEST : " + player.bestscore,
		SCREEN_W - 20, 40, 24,
		textcolor,
		textcolor, 1, shadowcolor);
}

function drawmainmenu() {
	textfuncshadow(textout_centre, canvas, myfont,
		"JUMP OFF LINE",
		SCREEN_W / 2, SCREEN_H / 2,
		44, textcolor, textoutlinecolor, 1, shadowcolor);

	textout_centre(canvas, myfont,
		"Click, tap, or press z to play.",
		SCREEN_W / 2, SCREEN_H / 2 + 80, 24, textoutlinecolor);
}

function drawgameover() {
	var fontsize = 30;

	textout_centre(canvas, myfont,
		"Click, tap, or press z to play again.",
		SCREEN_W / 2, SCREEN_H * 4 / 6, 24, textoutlinecolor);

	if (player.score > player.bestscore) {

		textfuncshadow(textout_centre, canvas, myfont,
			"★NEW RECORD★",
			SCREEN_W / 2, SCREEN_H * 2 / 6,
			fontsize * 1.7, textcolor, textoutlinecolor, 1, shadowcolor);

		textfuncshadow(textout_centre, canvas, myfont,
			"" + player.score,
			SCREEN_W / 2, SCREEN_H * 3 / 6,
			fontsize * 2, textcolor, textoutlinecolor, 1, shadowcolor);
	}
	else {
		textfuncshadow(textout, canvas, myfont,
			"SCORE",
			SCREEN_W * 0.2, SCREEN_H * 2 / 6,
			fontsize, textcolor, textoutlinecolor, 1, shadowcolor);
		textfuncshadow(textout_right, canvas, myfont,
			"" + player.score,
			SCREEN_W * 0.8, SCREEN_H * 2 / 6,
			fontsize, textcolor, textoutlinecolor, 1, shadowcolor);
		textfuncshadow(textout, canvas, myfont,
			"BEST SCORE",
			SCREEN_W * 0.2, SCREEN_H * 3 / 6,
			fontsize, textcolor, textoutlinecolor, 1, shadowcolor);
		textfuncshadow(textout_right, canvas, myfont,
			"" + player.bestscore,
			SCREEN_W * 0.8, SCREEN_H * 3 / 6,
			fontsize, textcolor, textoutlinecolor, 1, shadowcolor);
	}
}

function update() {
	updateframemessages();

	playerinput();

	if (gamestate == GAME) {
		updategame();
	}
	else if (gamestate == GAMEOVER) {
		updategameover();
	}
	else //if(gamestate == MAINMENU)
	{
		updatemainmenu();
	}

	updatesounds();
}

function playerinput() {
	var jumpkeypressed = mouse_pressed ||
		pressed[KEY_W] ||
		pressed[KEY_SPACE] ||
		pressed[KEY_Z];
	if(jumpkeypressed) {
		setframemessage("jumpkeypressed", true);
	}
}

function updatemainmenu() {
	if (getframemessage("jumpkeypressed", false)) {
		gamestate = GAME;
	}
}

function updategameover() {
	if (time() - gameovertime > 300 && getframemessage("jumpkeypressed", false)) {
		gamestate = GAME;
		initgame();
	}
}

function gameover() {
	gameovertime = time();
	gamestate = GAMEOVER;
	setframemessage("playerdied", true);

	if (player.score > player.bestscore) {
		setframemessagedelayed(time() + 500, "newrecordrun", true);
	}
}

function updategame() {

	if (player.y > SCREEN_H) {
		gameover();
	}

	var targx = player.x;
	var targy = player.y;

	var prevx = player.x;

	player.xmovecount += playerspeed;

	targx = pingpong(player.xmovecount, SCREEN_W - player.width);

	var newdir = -1;

	if (targx > prevx) {
		newdir = 1;
	}

	if (player.dir != newdir) {
		player.dir = newdir;

		if (player.dir == 1) {
			setframemessage("hitleft", true);
		}
		else {
			setframemessage("hitright", true);
		}
	}

	if (getframemessage("jumpkeypressed", false)) {
		jumpkeytime = time();
	}

	// jump
	if (player.grounded) {

		if (!player.wasgrounded) {
			// just landed
			setframemessage("playerlanded", true);
			player.landedtime = time();
		}

		if (time() - jumpkeytime < 100) {
			player.grounded = false;
			if (lastlinestandingon != null) {
				lastlinestandingon.ison = false;
				lastlinestandingon.offtime = time();
			}
			player.vely = jumpvel;
			player.score += 1;

			setframemessage("playerjumped", true);
		}
	}

	player.wasgrounded = player.grounded;

	targy += player.vely;

	var jumpheld = mouse_b || key[KEY_W] || key[KEY_SPACE] || key[KEY_Z];
	if (jumpheld && player.vely < 0) {
		player.vely += HELDGRAVITY;
	}
	else {
		player.vely += GRAVITY;
	}

	player.x = targx;

	if (player.grounded && lastlinestandingon != null) {
		player.y = lineypos(player.x + player.width / 2, lastlinestandingon);
		player.y -= player.height;
	}
	else {

		var ymove = targy - player.y;
		var dir = Math.sign(ymove);
		if (dir != 0) {
			player.grounded = false;
			ymove = Math.abs(ymove);
			for (var i = 0; i < ymove; i++) {
				var hit = hitsline(player, 0, dir, lines);
				if (hit == null) {
					player.y += dir;
				}
				else {
					if (dir >= 0) {
						player.grounded = true;
						lastlinestandingon = hit;
					}
					player.vely = 0;
					break;
				}
			}
		}
	}

	if (!player.grounded) {
		if (lastlinestandingon != null) {
			lastlinestandingon.ison = false;
			setframemessage("erasedline", lastlinestandingon);
			lastlinestandingon = null;
		}
	}

	// update game scrolling
	player.y -= gamespeed;

	scrolllines(gamespeed);

	spanwleveltimer -= gamespeed;
	if (spanwleveltimer <= 0) {
		addline(SCREEN_H + 50);
		spanwleveltimer += 60 + rand() % 30;
	}

	updatebombs();
	updateplayertrail();
	updateparticles();

}

function updatesounds() {
	if (getframemessage("playerlanded", false)) {
		playsound(land);
	}

	if (getframemessage("playerjumped", false)) {
		playsound(jump);
	}

	if (getframemessage("playerdied", false)) {
		playsound(died);
	}

	if (getframemessage("newrecordrun", false)) {
		playsound(newrecordrun);
	}

	if (getframemessage("hitleft", false)) {
		playsound(leftside);
	}

	if (getframemessage("hitright", false)) {
		playsound(rightside);
	}
}

function scrolllines(thegamespeed) {
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];
		if (line.isoffscreen == true) {
			continue;
		}

		var newy = line.y1 - thegamespeed;

		if (newy < -10) {
			line.isoffscreen = true;
		}
		else {

			line.y1 = newy;
			line.y2 = line.y2 - thegamespeed;
		}
	}
}

function updateplayertrail() {

	if (getframemessage("playerlanded", false)) {
		clearplayertrail();
	}

	var newitem = null;
	for (var i = 0; i < player.trail.length; i++) {
		var t = player.trail[i];
		t.y -= gamespeed;

		// contract it.
		t.y += 0.4;
		t.x += 0.4;
		t.width -= 0.8;
		t.height -= 0.8;

		if (t.width <= 0) {
			t.delete = true;
		}

		if (t.delete) {
			newitem = t;
		}
	}

	if (!player.grounded && time() - player.trailtime > 250) {

		if (newitem == null) {
			newitem = { x: 0, y: 0, width: 0, height: 0, time: 0, delete: false };
			player.trail.push(newitem);
		}

		newitem.x = player.x;
		newitem.y = player.y;
		newitem.width = player.width;
		newitem.height = player.height;
		newitem.time = time();
		newitem.delete = false;
	}
}

function updateparticles() {

	if (getframemessage("playerjumped", false)) {
		addparticles();
	}

	if (getframemessage("playerlanded", false)) {
		addparticles();
	}

	for (var i = 0; i < particles.length; i++) {
		particles[i].y -= gamespeed;
	}
}

function clearplayertrail() {
	for (var i = 0; i < player.trail.length; i++) {
		player.trail[i].delete = true;
	}
}

function updatebombs() {

	for (var i = 0; i < lines.length; i++) {
		var ln = lines[i];

		if (ln.hasbomb == false) {
			continue;
		}

		var bx = ln.bombpos;
		var by = lineypos(ln.bombpos, ln);

		if (incircle(player.x, player.y, bx, by, bombsize) ||
			incircle(player.x + player.width, player.y, bx, by, bombsize) ||
			incircle(player.x, player.y + player.height, bx, by, bombsize) ||
			incircle(player.x + player.width, player.y + player.height, bx, by, bombsize)) {
			gameover();
			return;
		}
		ln.bombcount += enemyspeed;
		ln.bombpos = pingpong(ln.bombcount, SCREEN_W);
	}
}

function hitsline(ent, xoffset, yoffset, lineslist) {
	var hw = ent.width / 2;
	testline.x1 = ent.x + xoffset + hw;
	testline.y1 = ent.y + yoffset;
	testline.x2 = ent.x + xoffset + hw;
	testline.y2 = ent.y + yoffset + ent.height;

	for (var i = 0; i < lineslist.length; i++) {
		if (lineslist[i].ison == false) {
			continue;
		}

		if (lineobjintersection(testline, lineslist[i])) {
			return lineslist[i];
		}
	}

	return null;
}

function addline(y) {

	var newline = getobjwhere(lines, 'isoffscreen', true);

	if (newline == null) {
		var newline = Object.create(linedef);
		lines.push(newline);
	}

	var x1 = 0; //rand() % 300;
	var x2 = SCREEN_W; // - (rand() % 300);
	var wid = x2 - x1;
	var bombpos = x1 + rand() % wid;

	var yoff = 60;
	var y1 = y + rand() % yoff - yoff / 2;
	var y2 = y + rand() % yoff - yoff / 2;

	newline.x1 = x1;
	newline.y1 = y1;
	newline.x2 = x2;
	newline.y2 = y2;
	newline.ison = true;
	newline.hasbomb = true;
	newline.bombcount = bombpos;
	newline.bombpos = bombpos;
	newline.isoffscreen = false;
}

function lineypos(xpos, line) {
	return lerp(line.y1, line.y2, xpos / SCREEN_W);
}

function initgame() {
	gamestarttime = time();
	lastlinestandingon = null;
	lines = [];
	var y = SCREEN_H + 50;
	var i;
	for (i = 0; i < 3; i++) {
		addline(y);
		y -= 80;
	}

	for (; i < 5; i++) {
		addline(y);
		lines[lines.length - 1].hasbomb = false;
		y -= 80;
	}

	spanwleveltimer = 80 + rand() % 30;

	player.x = 320;
	player.y = 0;
	player.xmovecount = 320;
	player.dir = 1;

	if (player.score > player.bestscore) {
		player.bestscore = player.score;
	}

	player.score = 0;
	clearplayertrail();
}

function addparticles() {
	var p = getobjwhere(particles, 'ison', false);

	if (p == null) {
		p = { x: 0, y: 0, time: 0, ison: true };
		particles.push(p);
	}

	p.x = player.x + player.width / 2;
	p.y = player.y + player.height;
	p.time = time();
	p.ison = true;
}

function drawparticles() {
	for (var i = 0; i < particles.length; i++) {
		var p = particles[i];
		if (p.ison) {
			var t = Math.floor((time() - p.time) / 50);
			var animindex = t % 7;

			// Turn it off here.
			if (animindex == 6) {
				p.ison = false;
				continue;
			}

			stretch_blit(tilesbmp, canvas,
				32 * animindex, 9 * 32, 32, 32,
				p.x - 20, p.y - 20, 40, 40);
		}
	}
}

function main() {
	enable_debug("debug");

	set_gfx_mode("canvas_id", 480, 640);

	install_keyboard([]);
	install_mouse();

	tilesbmp = load_bitmap("tiles.png");

	initgame();

	canvas.canvas.focus();

	myfont = create_font('sans-serif');

	window.onresize = function () {
		fixzoom();
	};

	fixzoom();

	ready(function () {

		loop(function () {

			clear_to_color(canvas, bgcolor);

			update();

			draw();

		}, BPS_TO_TIMER(60 * timescale));
	});

	return 0;
}
END_OF_MAIN();
