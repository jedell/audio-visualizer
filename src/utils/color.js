
export function changeHue(rgb, degree) {
    var hsl = rgbToHSL(rgb);
    hsl.h += degree;
    if (hsl.h > 360) {
        hsl.h -= 360;
    }
    else if (hsl.h < 0) {
        hsl.h += 360;
    }
    return hslToRGB(hsl);
}

// exepcts a string and returns an object
export function rgbToHSL(rgb) {
    // strip the leading # if it's there
    rgb = rgb.replace(/^\s*#|\s*$/g, '');

    // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
    if (rgb.length == 3) {
        rgb = rgb.replace(/(.)/g, '$1$1');
    }

    let r = parseInt(rgb.substr(0, 2), 16) / 255,
        g = parseInt(rgb.substr(2, 2), 16) / 255,
        b = parseInt(rgb.substr(4, 2), 16) / 255,
        cMax = Math.max(r, g, b),
        cMin = Math.min(r, g, b),
        delta = cMax - cMin,
        l = (cMax + cMin) / 2,
        h = 0,
        s = 0;

    if (delta == 0) {
        h = 0;
    }
    else if (cMax == r) {
        h = 60 * (((g - b) / delta) % 6);
    }
    else if (cMax == g) {
        h = 60 * (((b - r) / delta) + 2);
    }
    else {
        h = 60 * (((r - g) / delta) + 4);
    }

    if (delta == 0) {
        s = 0;
    }
    else {
        s = (delta / (1 - Math.abs(2 * l - 1)))
    }

    let c = { h: h, s: s, l: l }

    return c
}

// expects an object and returns a string
export function hslToRGB(hsl) {
    let h = hsl.h,
        s = hsl.s,
        l = hsl.l,
        c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c / 2,
        r, g, b;

    if (h < 60) {
        r = c;
        g = x;
        b = 0;
    }
    else if (h < 120) {
        r = x;
        g = c;
        b = 0;
    }
    else if (h < 180) {
        r = 0;
        g = c;
        b = x;
    }
    else if (h < 240) {
        r = 0;
        g = x;
        b = c;
    }
    else if (h < 300) {
        r = x;
        g = 0;
        b = c;
    }
    else {
        r = c;
        g = 0;
        b = x;
    }

    r = normalize_rgb_value(r, m);
    g = normalize_rgb_value(g, m);
    b = normalize_rgb_value(b, m);

    return rgbToHex(r, g, b);
}

export function hslToRGBNoHex(hsl) {
    let h = hsl.h,
        s = hsl.s,
        l = hsl.l,
        c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c / 2,
        r, g, b;

    if (h < 60) {
        r = c;
        g = x;
        b = 0;
    }
    else if (h < 120) {
        r = x;
        g = c;
        b = 0;
    }
    else if (h < 180) {
        r = 0;
        g = c;
        b = x;
    }
    else if (h < 240) {
        r = 0;
        g = x;
        b = c;
    }
    else if (h < 300) {
        r = x;
        g = 0;
        b = c;
    }
    else {
        r = c;
        g = 0;
        b = x;
    }

    r = normalize_rgb_value(r, m);
    g = normalize_rgb_value(g, m);
    b = normalize_rgb_value(b, m);

    return { r: r, g: g, b: b };
}

export function normalize_rgb_value(color, m) {
    color = Math.floor((color + m) * 255);
    if (color < 0) {
        color = 0;
    }
    return color;
}

export function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function hexToRGB(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export function colorsEqual(c1, c2) {
    let rgb1 = hslToRGBNoHex(rgbToHSL(c1))
    let rgb2 = hslToRGBNoHex(rgbToHSL(c2))

    return rgb1.r.between(rgb2.r + 10, rgb2.r - 10) && rgb1.g.between(rgb2.g + 10, rgb2.g - 10) && rgb1.b.between(rgb2.b + 10, rgb2.b - 10)
}

export function linearInterpolator(a, b, t) {
    return a + t * (b - a)
}

export function interpolate(a, b, step) {

    let ca = hslToRGBNoHex(rgbToHSL(a))
    let cb = hslToRGBNoHex(rgbToHSL(b))
    let c = { r: 0, g: 0, b: 0 };

    c.r = linearInterpolator(ca.r, cb.r, step)
    c.g = linearInterpolator(ca.g, cb.g, step)
    c.b = linearInterpolator(ca.b, cb.b, step)

    return rgbToHex(c.r, c.g, c.b).split(".")[0]
}

Number.prototype.between = function (a, b) {
    let min = Math.min.apply(Math, [a, b]),
        max = Math.max.apply(Math, [a, b]);
    return this > min && this < max;
};

String.prototype.difference = function (b) {
    console.log(this, b)
    let larger = this.length > b.length ? this : b
    let smaller = this.length > b.length ? b : this
    let count = 0
    for (let i = 0; i < larger.length; i++) {
        if (larger.charAt(i) !== smaller.charAt(i)) {
            count++
        }
    }
    return count;
}
// interpolate between color values that are determiend by NN classifier


// console.log(interpolate("#c2c506", "#dee03f", 1/47))

//work interpolation out ahead of time between four colors with function from codepen below
// once you have an array of all the colors its as easy as looping through those colors per frame

export function produceColorList(colors, numColors) {

    let colorList = []

    for (let i = 0; i < colors.length - 1; i++) {
        let first = colors[i]
        let last = colors[i + 1]

        for (let j = 0; j < numColors; j++) {
            let step = 1 / numColors * j
            colorList.push(interpolate(first, last, step))
        }
    }

    let first = colors[colors.length - 1]
    let last = colors[0]

    for (let k = 0; k < numColors; k++) {
        let step = 1 / numColors * k
        colorList.push(interpolate(first, last, step))
    }

    return colorList

}

export function makeDarker(c, n) {
    let rgb = hexToRGB(c)
    let cNew = {
        r: rgb.r - n,
        g: rgb.g - n,
        b: rgb.b - n
    }
    return rgbToHex(cNew.r, cNew.g, cNew.b)

}



// https://codepen.io/njmcode/pen/axoyD/