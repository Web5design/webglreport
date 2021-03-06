/**
Copyright (c) 2011-2012 Contributors.

The MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*jslint browser: true, vars: true, white: true, nomen: true*/
/*jshint white: false, nomen: false*/
/*global $, _*/
$(function() {
    "use strict";

    var canvas = $("<canvas />", { width: "1", height: "1" }).appendTo("body"),
        gl,
        contextName = _.find(["webgl", "experimental-webgl"], function(name) {
            try {
                gl = canvas[0].getContext(name, { stencil: true });
                return !!gl;
            } catch (e) {
                return false;
            }
        }),
        template = _.template($("#reportTemplate").html()),
        report = {
            platform: navigator.platform,
            userAgent: navigator.userAgent
        };

    canvas.remove();

    function getExtensionUrl(extension) {
        //special cases
        if (extension === "WEBKIT_lose_context") {
            extension = "WEBGL_lose_context";
        }
        else if (extension === "WEBKIT_WEBGL_compressed_textures") {
            extension = "";
        }
        extension = extension.replace(/^WEBKIT_/, "");
        extension = extension.replace(/^MOZ_/, "");
        extension = extension.replace(/_EXT_/, "_");

        return "http://www.khronos.org/registry/webgl/extensions/" + extension;
    }

    function renderReport(header) {
        $("#output").html(header + template({
            report: report,
            getExtensionUrl: getExtensionUrl
        }));
    }

    if (!gl) {
        renderReport($("#webglNotSupportedTemplate").html());
        return;
    }

    function describeRange(value) {
        return "[" + value[0] + ", " + value[1] + "]";
    }

    function getMaxAnisotropy() {
        var e = gl.getExtension("EXT_texture_filter_anisotropic")
                || gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic")
                || gl.getExtension("MOZ_EXT_texture_filter_anisotropic");

        if (e) {
            var max = gl.getParameter(e.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            // See Canary bug: http://code.google.com/p/chromium/issues/detail?id=117450
            if (max === 0) {
                max = 2;
            }
            return max;
        }
        return null;
    }

	var lineWidthRange = describeRange(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE));
	
    report = _.extend(report, {
        contextName: contextName,
        glVersion: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        antialias:  gl.getContextAttributes().antialias ? 'Available' : 'Not available',
        angle: (navigator.platform === "Win32") && (lineWidthRange === describeRange([1,1])),
        redBits: gl.getParameter(gl.RED_BITS),
        greenBits: gl.getParameter(gl.GREEN_BITS),
        blueBits: gl.getParameter(gl.BLUE_BITS),
        alphaBits: gl.getParameter(gl.ALPHA_BITS),
        depthBits: gl.getParameter(gl.DEPTH_BITS),
        stencilBits: gl.getParameter(gl.STENCIL_BITS),
        maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
        maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
        maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
        maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
        maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
        maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
        aliasedLineWidthRange: lineWidthRange,
        aliasedPointSizeRange: describeRange(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)),
        maxViewportDimensions: describeRange(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
        maxAnisotropy: getMaxAnisotropy(),
        extensions: gl.getSupportedExtensions()
    });

    if (window.externalHost) {
        // Tab is running with Chrome Frame
        renderReport($("#webglSupportedChromeFrameTemplate").html());
    }
    else {
        renderReport($("#webglSupportedTemplate").html());
    }

    var pipeline = $(".pipeline"),
        background = $(".background")[0];

    background.width = pipeline.width();
    background.height = pipeline.height();

    var hasVertexTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) > 0;

    var context = background.getContext("2d");
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 3;
    context.shadowBlur = 7;
    context.shadowColor = "rgba(0, 0, 0, 0.5)";
    context.strokeStyle = "black";

    var boxPadding = 4;

    function drawBox(element, fill) {
        var pos = element.position(),
            x = pos.left - boxPadding,
            y = pos.top - boxPadding,
            width = element.outerWidth() + (boxPadding * 2),
            height = element.outerHeight() + (boxPadding * 2),
            radius = 10;

        context.fillStyle = fill;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
        context.stroke();
        context.fill();

        return { x: x, y: y, width: width, height: height };
    }

    function drawLeftHead(x, y) {
        context.beginPath();
        context.moveTo(x + 5, y + 15);
        context.lineTo(x - 10, y);
        context.lineTo(x + 5, y - 15);
        context.quadraticCurveTo(x, y, x + 5, y + 15);
        context.fill();
    }

    function drawDownHead(x, y) {
        context.beginPath();
        context.moveTo(x + 15, y - 5);
        context.lineTo(x, y + 10);
        context.lineTo(x - 15, y - 5);
        context.quadraticCurveTo(x, y, x + 15, y - 5);
        context.fill();
    }

    function drawDownArrow(topBox, bottomBox) {
        context.beginPath();

        var arrowTopX = (topBox.x + topBox.width) / 2,
            arrowTopY = topBox.y + topBox.height,
            arrowBottomX = (bottomBox.x + bottomBox.width) / 2,
            arrowBottomY = bottomBox.y - 15;
        context.moveTo(arrowTopX, arrowTopY);
        context.lineTo(arrowBottomX, arrowBottomY);
        context.stroke();

        drawDownHead(arrowBottomX, arrowBottomY);
    }

    var vertexShaderBox = drawBox($(".vertexShader"), "#ff6700"),
        rasterizerBox = drawBox($(".rasterizer"), "#3130cb"),
        fragmentShaderBox = drawBox($(".fragmentShader"), "#ff6700"),
        framebufferBox = drawBox($(".framebuffer"), "#7c177e"),
        texturesBox = drawBox($(".textures"), "#3130cb");

    var arrowRightX = texturesBox.x,
        arrowRightY = texturesBox.y + (texturesBox.height / 2),
        arrowMidX = (texturesBox.x + vertexShaderBox.x + vertexShaderBox.width) / 2,
        arrowMidY = arrowRightY,
        arrowTopMidY = vertexShaderBox.y + (vertexShaderBox.height / 2),
        arrowBottomMidY = fragmentShaderBox.y + (fragmentShaderBox.height / 2),
        arrowTopLeftX = vertexShaderBox.x + vertexShaderBox.width + 15,
        arrowTopLeftY = arrowTopMidY,
        arrowBottomLeftX = fragmentShaderBox.x + fragmentShaderBox.width + 15,
        arrowBottomLeftY = arrowBottomMidY;

	if (hasVertexTextureUnits) {
	    context.fillStyle = context.strokeStyle = "black";
	    context.lineWidth = 10;
	} else {
		context.fillStyle = context.strokeStyle = "#FFF";
	    context.shadowColor = "#000";
		context.shadowOffsetX = context.shadowOffsetY = 0;
	    context.lineWidth = 8;
	}

	context.beginPath();
	context.moveTo(arrowMidX, arrowMidY);
	context.lineTo(arrowMidX, arrowTopMidY);
	if (hasVertexTextureUnits) {
		context.lineTo(arrowTopLeftX, arrowTopMidY);
		context.stroke();
		drawLeftHead(arrowTopLeftX, arrowTopLeftY);
	} else {
		context.stroke();
	    context.shadowColor = "#000";
		context.font = "bold 14pt arial, Sans-Serif";
		context.fillText("No vertex textures available.", arrowMidX - 8, arrowTopMidY - 8);
	}

    context.lineWidth = 10;
    context.fillStyle = context.strokeStyle = "black";
    context.shadowColor = "rgba(0, 0, 0, 0.5)";
	context.shadowOffsetX = context.shadowOffsetY = 3;
    context.beginPath();

    context.moveTo(arrowRightX, arrowRightY);

    context.lineTo(arrowMidX - context.lineWidth * 0.5, arrowMidY);
	context.moveTo(arrowMidX, arrowMidY);
    context.lineTo(arrowMidX, arrowBottomMidY);
    context.lineTo(arrowBottomLeftX, arrowBottomLeftY);

    context.stroke();

    drawLeftHead(arrowBottomLeftX, arrowBottomLeftY);

    drawDownArrow(vertexShaderBox, rasterizerBox);
    drawDownArrow(rasterizerBox, fragmentShaderBox);
    drawDownArrow(fragmentShaderBox, framebufferBox);

});