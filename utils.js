
var framemessages = {};

// not doing sounds on mobile. it was not working and lagging.
var ismobile = false;
(function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) ismobile = true; })(navigator.userAgent || navigator.vendor || window.opera);

var dosounds = !ismobile;
var soundplayers = [
	new Audio(),
	new Audio(),
	new Audio(),
	new Audio()
];
var soundplayerindex = 0;

function getframemessage(name, defaultvalue) {
	if (framemessages[name]) {
		if (framemessages[name].isactive == true) {
			return framemessages[name].data;
		}
	}
	return defaultvalue;
}

function setframemessage(name, value) {
	if (framemessages[name] != null) {
		var m = framemessages[name];
		m.isactive = true;
		m.data = value;
		m.iswaiting = false;
		m.time = 0;
	}
	else {
		framemessages[name] = {
			isactive: true,
			data: value,
			iswaiting: false,
			time: 0
		};
	}
}

function updateframemessages() {
	for (var key in framemessages) {
		var msg = framemessages[key];
		msg.isactive = false;

		if (msg.iswaiting) {
			if (time() > msg.time) {
				msg.isactive = true;
				msg.iswaiting = false;
			}
		}
	}
}

function setframemessagedelayed(time, name, value) {
	if (framemessages[name] != null) {
		var m = framemessages[name];
		m.isactive = false;
		m.data = value;
		m.iswaiting = true;
		m.time = time;
	}
	else {
		framemessages[name] = {
			isactive: false,
			data: value,
			iswaiting: true,
			time: time
		};
	}
}

function fixcolor(c, alpha) {
	return makecol(getr(c), getg(c), getb(c), alpha);
}

function textfuncshadow(func, canvas, myfont, text, x, y, size, col1, col2, outline, shadowcol) {
	var xoff = 3;
	var yoff = 3;
	func(canvas, myfont, text, x + xoff, y + yoff, size, shadowcol, shadowcol, outline);
	func(canvas, myfont, text, x, y, size, col1, col2, outline);
}

function playsound(sound) {
	if (!dosounds) {
		return;
	}

	var soundplayer = soundplayers[soundplayerindex];
	soundplayerindex = (soundplayerindex + 1) % soundplayers.length;
	soundplayer.src = sound;
	soundplayer.play();
}

function incircle(x, y, cx, cy, cs) {
	var dx = x - cx;
	var dy = y - cy;
	return dx * dx + dy * dy <= cs * cs;
}

function pingpong(amnt, max) {
	if (amnt < max) {
		return amnt;
	}

	var dir = 1;
	while (amnt > max) {
		amnt -= max;
		dir *= -1;
	}

	if (dir == 1) {
		return amnt;
	}
	return max - amnt;
}
function lineobjintersection(line1, line2) {
	return lineintersection(
		line1.x1, line1.y1, line1.x2, line1.y2,
		line2.x1, line2.y1, line2.x2, line2.y2);
}

function lineintersection(p0_x, p0_y, p1_x, p1_y,
	p2_x, p2_y, p3_x, p3_y) {
	var s1_x, s1_y, s2_x, s2_y;
	s1_x = p1_x - p0_x; s1_y = p1_y - p0_y;
	s2_x = p3_x - p2_x; s2_y = p3_y - p2_y;

	var s, t;
	s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
	t = (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

	if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
		return true;
	}

	return false; // No collision
}

function getobjwhere(objslist, prop, value) {
	for (var i = 0; i < objslist.length; i++) {
		if (objslist[i][prop] == value) {
			return objslist[i];
		}
	}
	return null;
}

function fixzoom() {

	var ratio = SCREEN_W / SCREEN_H;
	var h = window.innerHeight;
	var w = window.innerHeight * ratio;

	if (w > window.innerWidth) {
		w = window.innerWidth;
		h = window.innerWidth / ratio;
	}

	canvas.canvas.style.height = h + "px";
	canvas.canvas.style.width = w + "px";
	canvas.canvas.style.left = (window.innerWidth - w) / 2 + "px";
	canvas.canvas.style.top = (window.innerHeight - h) / 2 + "px";
}
