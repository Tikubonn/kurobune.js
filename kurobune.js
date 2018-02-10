
/* charset */

function KurobuneCharset (charactors, classname){
	this.charactors = new Set(charactors);
	this.classname = classname;
}

KurobuneCharset.prototype.has = function (char){
	return this.charactors.has(char);
};

/* functional charset */

function KurobuneFunctionalCharset (predicate, classname){
	this.predicate = predicate;
	this.classname = classname;
}

KurobuneCharset.prototype = 
	Object.create(KurobuneCharset.prototype);

KurobuneFunctionalCharset.prototype.has = function (char){
	return this.predicate(char);
};

/* table */

function KurobuneTable (charsets){
	this.charsets = Array.from(charsets);
};

KurobuneTable.prototype.has = function (char){
	var found = this.charsets.find(
		function (charset){
			return charset.has(char);
		});
	return found ? true : false;
};

KurobuneTable.prototype.get = function (char){
	var found = this.charsets.find(
		function (charset){
			return charset.has(char);
		});
	return found ? found : null;
};

/* stream */

function KurobuneStream (source){
	this.source = source;
	this.index = 0;
}

KurobuneStream.prototype.eof = function (){
	return this.source.length <= this.index;
};

KurobuneStream.prototype.look = function (){
	return this.index < this.source.length ? 
		this.source[this.index]: null;
};

KurobuneStream.prototype.get = function (){
	return this.index < this.source.length ?
		this.source[this.index++]: null;
};

/* parser */

function KurobuneParser (table){
	this.table = table;
	this.nodes = new Array();
};

KurobuneParser.prototype.generateMatch = function (data, classname){
	var dom = document.createElement("span");
	var domContent = document.createTextNode(data);
	dom.appendChild(domContent);
	dom.className = classname;
	return dom;
};

KurobuneParser.prototype.generateUnmatch = function (data){
	return document.createTextNode(data);
};

KurobuneParser.prototype.read = function (stream){
	var charset = this.table.get(stream.look());
	return charset ? this.readC(stream, charset): this.readD(stream);
};

KurobuneParser.prototype.readC = function (stream, charset){
	var data = "";
	while (!stream.eof() && this.table.get(stream.look()) == charset)
		data += stream.get();
	return this.generateMatch(data, charset.classname);
};

KurobuneParser.prototype.readD = function (stream){
	var data = "";
	while (!stream.eof() && !this.table.has(stream.look()))
		data += stream.get();
	return this.generateUnmatch(data);
};

KurobuneParser.prototype.parse = function (stream){
	while (!stream.eof()){
		this.nodes.push(
			this.read(stream));
	}
};

KurobuneParser.prototype.getNodes = function (){
	return this.nodes;
};

/* main */

function Kurobune (table){
	this.table = table;
}

Kurobune.prototype.apply = function (someone, parent){
	typeof someone == "string" ? this.applySelector(someone, parent):
	someone instanceof String ? this.applySelector(someone, parent):
	someone instanceof HTMLElement ? this.applyNode(someone):
	someone instanceof Text ? this.applyTextNode(someone) : null;
};

Kurobune.prototype.applySelector = function (selector, parent){
	var parent = parent || document.body;
	Array.from(parent.querySelectorAll(selector)).map(this.applyNode, this);
};

Kurobune.prototype.applyNode = function (node){
	Array.from(node.childNodes).map(this.applyTextNode, this);
};

Kurobune.prototype.applyTextNode = function (node){
	if (node instanceof Text){
		var stream = new KurobuneStream(node.data);
		var parser = new KurobuneParser(this.table);
		parser.parse(stream);
		var nodes = parser.getNodes();
		nodes.map(
			function (nd){
				node.parentNode.insertBefore(nd, node);
			});
		node.parentNode.removeChild(node);
	}
};
