/*
______ _   _ ______      ___  _________ _____ _____ 
| ___ \ | | || ___ \     |  \/  || ___ \  _  /  ___|
| |_/ / |_| || |_/ /_____| .  . || |_/ / | | \ `--. 
|  __/|  _  ||  __/______| |\/| ||  __/| | | |`--. \
| |   | | | || |         | |  | || |   \ \_/ /\__/ /
\_|   \_| |_/\_|         \_|  |_/\_|    \___/\____/ 
 _____            _     _                         _  __      ____   ___  
|  __ \          | |   | |                       | | \ \    / /_ | / _ \ 
| |  | | __ _ ___| |__ | |__   ___   __ _ _ __ __| |  \ \  / / | || | | |
| |  | |/ _` / __| '_ \| '_ \ / _ \ / _` | '__/ _` |   \ \/ /  | || | | |
| |__| | (_| \__ \ | | | |_) | (_) | (_| | | | (_| |    \  /   | || |_| |
|_____/ \__,_|___/_| |_|_.__/ \___/ \__,_|_|  \__,_|     \/    |_(_)___/ 

Version 1.0 of the PHP-MPOS Dashboard Desklet
Some things can be customised in here, but try not to mess with it too much :)

*/
const Gio = imports.gi.Gio;
const St = imports.gi.St;
const Desklet = imports.ui.desklet;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Tweener = imports.ui.tweener;
const Util = imports.misc.util;
const Main = imports.ui.main;

const Tooltips = imports.ui.tooltips;
const PopupMenu = imports.ui.popupMenu;
const Cinnamon = imports.gi.Cinnamon;
const Settings = imports.ui.settings;

const Soup = imports.gi.Soup
let session = new Soup.SessionAsync();
Soup.Session.prototype.add_feature.call(session, new Soup.ProxyResolverDefault());

function MyDesklet(metadata, desklet_id){
	this._init(metadata, desklet_id);
}

MyDesklet.prototype = {
	__proto__: Desklet.Desklet.prototype,
	
	_init: function(metadata, desklet_id){
		Desklet.Desklet.prototype._init.call(this, metadata);
		
		//configure variables from metadata.json
		this.metadata = metadata
		this.mposName = "PHP-MPOS Dashboard";
		
		this.settings = new Settings.DeskletSettings(this, "mpos@incrediblehulk", this.desklet_id);
		this.settings.bindProperty(Settings.BindingDirection.ONE_WAY,"mposURL","mposURL",this.update_dashboard,null);
		this.settings.bindProperty(Settings.BindingDirection.ONE_WAY,"mposAPIKey","mposAPIKey",this.update_dashboard,null);
		this.settings.bindProperty(Settings.BindingDirection.ONE_WAY,"mposInterval","mposInterval",this.update_dashboard,null);
		
		//setup the elements
		//main element
		this._dashboardContainer = new St.BoxLayout({vertical:true, style_class: 'dashboard-container'});
		
		//pool information
		this._poolContainer =  new St.BoxLayout({vertical:false, style_class: 'pool-name'});
		
		//title and confirmations elements
		this._titleContainer =  new St.BoxLayout({vertical:false, style_class: 'title-container'});
		this._confContainer =  new St.BoxLayout({vertical:false, style_class: 'amount-container-conf'});
		this._title2Container =  new St.BoxLayout({vertical:false, style_class: 'title-container'});
		this._unconfContainer =  new St.BoxLayout({vertical:false, style_class: 'amount-container-unconf'});
				
		//hashrate information
		this._hashtitleContainer =  new St.BoxLayout({vertical:false, style_class: 'title-container'});
		this._hashrateContainer =  new St.BoxLayout({vertical:false, style_class: 'hash-rate'});
		
		//block information
		this._timesincelasttitleContainer =  new St.BoxLayout({vertical:false, style_class: 'title-container'});
		this._timesincelastContainer =  new St.BoxLayout({vertical:false, style_class: 'time-since-last'});
		this._lastblocktitleContainer =  new St.BoxLayout({vertical:false, style_class: 'title-container'});
		this._lastblockContainer =  new St.BoxLayout({vertical:false, style_class: 'last-block'});
		this._currentnetblocktitleContainer =  new St.BoxLayout({vertical:false, style_class: 'title-container'});
		this._currentnetblockContainer =  new St.BoxLayout({vertical:false, style_class: 'current-net-block'});
		
		//title and confirmation text labels
		this._title = new St.Label();
		this._conf = new St.Label({style_class: 'amount-container-conf-text'});
		this._title2 = new St.Label();
		this._unconf = new St.Label({style_class: 'amount-container-unconf-text'});
		
		//pool labels
		this._poolname = new St.Label();
		
		//hashrate labels
		this._hashtitle = new St.Label();
		this._hashrate = new St.Label();
		
		//block labels
		this._timesincelasttitle = new St.Label();
		this._timesincelast = new St.Label();
		this._lastblocktitle = new St.Label();
		this._lastblock = new St.Label();
		this._currentnetblocktitle = new St.Label();
		this._currentnetblock = new St.Label();
		
		//setup elements to contain labels
		this._titleContainer.add(this._title);
		this._confContainer.add(this._conf);
		this._title2Container.add(this._title2);
		this._unconfContainer.add(this._unconf);
		
		//pool elements
		this._poolContainer.add(this._poolname);
		
		//hashrate elements
		this._hashtitleContainer.add(this._hashtitle);
		this._hashrateContainer.add(this._hashrate);
		
		//block elements
		this._timesincelasttitleContainer.add(this._timesincelasttitle);
		this._timesincelastContainer.add(this._timesincelast);
		this._lastblocktitleContainer.add(this._lastblocktitle);
		this._lastblockContainer.add(this._lastblock);
		this._currentnetblocktitleContainer.add(this._currentnetblocktitle);
		this._currentnetblockContainer.add(this._currentnetblock);
		
		//add elements to main dashboard element
		this._dashboardContainer.add(this._poolContainer, {x_fill: false, x_align: St.Align.MIDDLE});
		this._dashboardContainer.add(this._titleContainer, {x_fill: false, x_align: St.Align.MIDDLE});
		this._dashboardContainer.add(this._confContainer, {x_fill: true, x_align: St.Align.MIDDLE});
		this._dashboardContainer.add(this._title2Container, {x_fill: false, x_align: St.Align.MIDDLE});
		this._dashboardContainer.add(this._unconfContainer, {x_fill: true, x_align: St.Align.MIDDLE});
		this._dashboardContainer.add(this._hashtitleContainer, {x_fill: false, x_align: St.Align.MIDDLE});
		this._dashboardContainer.add(this._hashrateContainer, {x_fill: true, x_align: St.Align.MIDDLE});
		this._dashboardContainer.add(this._timesincelasttitleContainer, {x_fill: false, x_align: St.Align.MIDDLE});
		this._dashboardContainer.add(this._timesincelastContainer, {x_fill: true, x_align: St.Align.MIDDLE});
		this._dashboardContainer.add(this._lastblocktitleContainer, {x_fill: false, x_align: St.Align.MIDDLE});
		this._dashboardContainer.add(this._lastblockContainer, {x_fill: true, x_align: St.Align.MIDDLE});
		this._dashboardContainer.add(this._currentnetblocktitleContainer, {x_fill: false, x_align: St.Align.MIDDLE});
		this._dashboardContainer.add(this._currentnetblockContainer, {x_fill: true, x_align: St.Align.MIDDLE});
		
		//setup content and header
		this.setContent(this._dashboardContainer);
		this.setHeader(_(this.mposName));
		
		//set default label values on initial load
		this._poolname.set_text('Loading..');
		this._title.set_text('Confirmed');
		this._conf.set_text('0');
		this._title2.set_text('Unconfirmed');
		this._unconf.set_text('0');
		this._hashtitle.set_text('Hashrate');
		this._hashrate.set_text('0 GH/S');
		this._timesincelasttitle.set_text('Time Since Last Block');
		this._timesincelast.set_text('0');
		this._lastblocktitle.set_text('Last Block Found');
		this._lastblock.set_text('0');
		this._currentnetblocktitle.set_text('Current Block');
		this._currentnetblock.set_text('0');
		
		//set file paths
		this.mposDashData = GLib.get_home_dir() + "/.local/share/cinnamon/desklets/mpos@incrediblehulk/dashdata.json";
		this.mposBlockData = GLib.get_home_dir() + "/.local/share/cinnamon/desklets/mpos@incrediblehulk/blockdata.json";
		this.configFile = GLib.get_home_dir() + "/.local/share/cinnamon/desklets/mpos@incrediblehulk/metadata.json";
		this.helpFile = GLib.get_home_dir() + "/.local/share/cinnamon/desklets/mpos@incrediblehulk/README";
		
		global.log("Config file " + this.configFile);
		
		//setup menu options
		this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		this._menu.addAction(_("Edit Config"), Lang.bind(this, function() {
			Util.spawnCommandLine("cinnamon-settings desklets mpos@incrediblehulk")
		}));
		this._menu.addAction(_("Help"), Lang.bind(this, function() {
			Util.spawnCommandLine("xdg-open " + this.helpFile);
		}));
		
		//run the dashboard
		this.update_dashboard();
	},
	
	on_desklet_removed: function() {
		Mainloop.source_remove(this.timeout);
	},
	
	download_json: function(url, localFilename, callback) {	 
		let outFile = Gio.file_new_for_path(localFilename);	
		var outStream = new Gio.DataOutputStream({base_stream:outFile.replace(null, false, Gio.FileCreateFlags.NONE, null)});
		var message = Soup.Message.new('GET', url);
		session.queue_message(message, function(session, response) {
		if (response.status_code !== Soup.KnownStatusCode.OK) {
			global.log("Error during download: response code " + response.status_code + ": " + response.reason_phrase + " - " + response.response_body.data);
			callback(false, null);
			return true;
		}
		try {
			Cinnamon.write_soup_message_to_stream(outStream, message);
			outStream.close(null);
		}
		catch (e) {
			global.logError("Site seems to be down. Error was:");
			global.logError(e);
			callback(false, null);
			return true;
		}
		callback(true, localFilename);
		return false;
	    });
	},
        on_json_downloaded: function(success, filename, cached) {
		if (success) {
			if (filename.indexOf("dashdata") != -1) {
				this.mposdashjson = JSON.parse(Cinnamon.get_file_contents_utf8_sync(filename));
				
				if (this.mposdashjson) {
					this._poolname.set_text(JSON.stringify(this.mposdashjson.getdashboarddata.data.pool.info.name).replace(/"/g, ""));
					this._conf.set_text(this.mposdashjson.getdashboarddata.data.personal.balance.confirmed.toFixed(6) + ' ' + JSON.stringify(this.mposdashjson.getdashboarddata.data.pool.info.currency).replace(/"/g, ""));
					this._unconf.set_text(this.mposdashjson.getdashboarddata.data.personal.balance.unconfirmed.toFixed(6) + ' ' + JSON.stringify(this.mposdashjson.getdashboarddata.data.pool.info.currency).replace(/"/g, ""));
					this.hashtype = parseInt(JSON.stringify(this.mposdashjson.getdashboarddata.data.raw.personal.hashrate).length);
					
					if (this.hashtype >= 7) {
						this._hashrate.set_text(((this.mposdashjson.getdashboarddata.data.raw.personal.hashrate / 1000) / 1000).toFixed(3) + " GH/S");
					}  
					else if (this.hashtype <= 6 && this.hashtype >= 4) {
						this._hashrate.set_text((this.mposdashjson.getdashboarddata.data.raw.personal.hashrate / 1000).toFixed(3) + " MH/S");
					}  
					else if (this.hashtype <= 3 && this.hashtype >= 0) {
						this._hashrate.set_text(this.mposdashjson.getdashboarddata.data.raw.personal.hashrate + " KH/S");
					}
				}
			}
			if (filename.indexOf("blockdata") != -1) {
				this.mposblockjson = JSON.parse(Cinnamon.get_file_contents_utf8_sync(filename));
				
				if (this.mposblockjson) {
					this.timesince = JSON.stringify(this.mposblockjson.getpoolstatus.data.timesincelast);
					this.timesince_arr0 = (''+Math.floor(this.timesince/3600) % 24).slice(-2)+'h '; 
					this.timesince_arr1 = (''+Math.floor(this.timesince/60)%60).slice(-2)+'m ';
					this.timesince_arr2 = ('' + this.timesince % 60).slice(-2) + 's';
					if (~this.timesince_arr0.indexOf("0h")) {
						this.time_val = '';
					} else {
						this.time_val = this.timesince_arr0;
					}
					if (~this.timesince_arr1.indexOf("0m")) {
						this.time_val = this.time_val + '';
					} else {
						this.time_val = this.time_val + this.timesince_arr1;
					}
					if (~this.timesince_arr2.indexOf("0s")) {
						this.time_val = this.time_val + '';
					} else {
						this.time_val = this.time_val + this.timesince_arr2;
					}
					this._timesincelast.set_text(this.time_val);
					this._lastblock.set_text(JSON.stringify(this.mposblockjson.getpoolstatus.data.lastblock));
					this._currentnetblock.set_text(JSON.stringify(this.mposblockjson.getpoolstatus.data.currentnetworkblock));
				}
			}
		}
		else {
			//global.log('No joy, no json');
		}
		return true;
	},
	update_dashboard: function(){
		this.download_json(this.mposURL + '/index.php?page=api&action=getdashboarddata&api_key=' + this.mposAPIKey, this.mposDashData, Lang.bind(this, this.on_json_downloaded));
		this.download_json(this.mposURL + '/index.php?page=api&action=getpoolstatus&api_key=' + this.mposAPIKey, this.mposBlockData, Lang.bind(this, this.on_json_downloaded));
		this.timeout = Mainloop.timeout_add_seconds(this.mposInterval, Lang.bind(this, this.update_dashboard));
	}
}

function main(metadata, desklet_id){
	let desklet = new MyDesklet(metadata, desklet_id);
	return desklet;
}
