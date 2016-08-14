define(function(require, exports, module) {
    var PATH = require('path');
    
    main.consumes = [
        "Plugin", "ui", "commands", "menus", "dialog.alert",
        "fs", "preferences", "settings"
    ];
    main.provides = ["projectmanager"];
    return main;

    function main(options, imports, register) {
        var Plugin = imports.Plugin;
        var ui = imports.ui;
        var commands = imports.commands;
        var menus = imports.menus;
        var fs = imports.fs;
        var prefs = imports.preferences;
        var settings = imports.settings;
        
        var SettingsKey = {
            PROJECT_PATH: "user/project_manager/@project_path",
            PROJECTS_PATH: "user/project_manager/@projects_path"
        }
        
        /***** Initialization *****/
        
        var plugin = new Plugin("Ajax.org", main.consumes);
        var emit = plugin.getEmitter();
        
        var loaded = false;
        function load() {
            if (loaded) return false;
            loaded = true;
            
            settings.on("read", function(){
                settings.setDefaults("user/project_manager", [
                    ["project_path", "~/project"],
                    ["projects_path", "~/projects"]
                ]);
            }, plugin);
            
            prefs.add({
                "Plugins" : {
                    position: 450,
                    "Project Manager" : {
                        position: 100,
                        "Directory of opened project": {
                            type: "textbox",
                            setting: SettingsKey.PROJECT_PATH,
                            position: 100
                        },
                        "Directory with projects": {
                            type: "textbox",
                            setting: SettingsKey.PROJECTS_PATH,
                            position: 200
                        }
                    }
                }
            }, plugin);
            
            // commands.addCommand({
            //     name: "openproject",
            //     hint: "open c9 project in cloud9",
            //     msg: "open project",
            //     bindKey: { mac: "Command-O", win: "Ctrl-O" },
            //     exec: function(editor, args) {
            //         console.log(editor, args);
            //         // openProject(args.mode, editor, args.all);
            //         // openProject('plapped.com');
            //     }
            // }, plugin);
            
            getProjects();
        }
        
        /***** Methods *****/
        
        function getSettingsWithRootPrefix(settingsKey) {
            var value = settings.get(settingsKey);
            value.charAt(0) !== '~' && (value = '~' + value);
            value.charAt(1) !== '/' && (value = '/' + value);
            return value;
        }
        
        function getProjects() {
            var mnuFormat = new ui.menu({
                onitemclick: function(e) {
                    if (e.value && e.value != "auto") {
                        openProject(e.value);
                        // console.log(e.value);
                    }
                }
            });
            
            menus.addItemByPath("File/Open Project/", mnuFormat, 501, plugin);
            
            fs.readdir(getSettingsWithRootPrefix(SettingsKey.PROJECTS_PATH), function (err, files) {
                if (err) {
                    console.log(err);
                    throw new err;
                }
                
                var c = 0;
         
                files.forEach(function (file) {
                    if (!/directory$/.test(file.mime)
                            || file.name.charAt(0) === '.') {
                        return;
                    }
                    
                    menus.addItemByPath(
                        "File/Open Project/" + file.name,
                        new ui.item({value: file.name}),
                        c += 100, plugin);
                });
            });
        }
        
        /**
         * Open project
         * 
         * @param {string} projectName  directory name of project
         */
        function openProject(projectName) {
            closeProject(function () {
                fs.symlink(getSettingsWithRootPrefix(SettingsKey.PROJECT_PATH),
                    PATH.join(getSettingsWithRootPrefix(SettingsKey.PROJECT_PATH), projectName),
                    function (err, data) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        
                        window.location.reload();
                    });
            });
        }
        
        /**
         * Close current project
         * 
         * @param {Function} callback   called after file unlinked
         */
        function closeProject(callback) {
            fs.unlink('~/project', function (err) {
                if (err) {
                    console.log(err);
                    return;
                }
                
                callback();
            });
        }
        
        /***** Lifecycle *****/
        plugin.on("load", function() {
            load();
        });
        plugin.on("enable", function() {
            
        });
        plugin.on("disable", function() {
            
        });
        plugin.on("unload", function() {
            loaded = false;
        });
        
        
        register(null, {
            projectmanager: plugin
        });
    }
});