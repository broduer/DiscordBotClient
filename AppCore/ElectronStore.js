const Store = require('electron-store');
const defaultSetting = require('../AppAssets/SettingProto');
const _ = require('lodash');
const { app } = require('electron');
const SettingProto = require('../AppAssets/SettingProto');
const store = new Store({
	encryptionKey: "elysia-discord-bot-client",
});

const LatestStorageUpdate = 1719725273000;

// Validated
if (
	!store.get('version') ||
	!store.get('latestUpdate') ||
	store.get('latestUpdate') < LatestStorageUpdate
) {
	store.clear();
	store.set('version', app.getVersion());
	store.set('latestUpdate', LatestStorageUpdate);
}

/*
key: id
value: {
    settingProto: {
        data1,
        data2,
        data3,
    },
	privateChannel: {
		id: {
			// data
		}
	}
    ... some value
}
*/

class ElectronDatabase {
	#db = store;
	constructor() {}
	/**
	 * Get db (or create)
	 */
	get(uid) {
		const data = this.#get(uid);
		if (data?.settingProto?.data1) {
			data.settingProto.data1.guildFolders = {
				folders: [],
				guildPositions: [],
			};
			data.settingProto.data1.userContent =
				SettingProto.data1.userContent;
		}
		if (!data.privateChannel) {
			data.privateChannel = {};
		}
		return data;
	}
	#get(uid) {
		if (this.#db.has(uid)) {
			return this.#db.get(uid);
		} else {
			this.#db.set(uid, {
				settingProto: defaultSetting,
				privateChannel: {},
			});
			return this.#get(uid);
		}
	}
	/**
	 * Set Partial<data>
	 */
	set(uid, data, force = false) {
		if (force) {
			this.#db.set(uid, data);
		} else {
			const oldData = this.get(uid);
			const merge = _.merge(oldData, data);
			this.#db.set(uid, merge);
		}
		return this.get(uid);
	}
	/**
	 * delete
	 */
	delete(uid) {
		this.#db.delete(uid);
	}
	deleteAll() {
		for (let [k, v] of this.#db) {
			if (/\d{17,19}/.test(k)) {
				this.delete(k);
			}
		}
	}
	deleteDMs(uid) {
		const user = this.get(uid);
		delete user.privateChannel;
		user.privateChannel = {};
		this.set(uid, user, true);
	}
	get database() {
		return this.#db;
	}
}

module.exports = new ElectronDatabase();
