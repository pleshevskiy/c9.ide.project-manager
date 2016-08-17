define(function(require, exports, module) {
    var PATH = require('path');
    
    main.consumes = [
        "Plugin", "ui", "commands", "menus", "dialog.alert", "tree",
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
        var tree = imports.tree;
        var menu;
        
        var SettingsKey = {
            PROJECT_NAME: "user/project_manager/@project_name",
            PROJECT_PATH: "user/project_manager/@project_path",
            PROJECTS_PATH: "user/project_manager/@projects_path"
        };
        
        /***** Initialization *****/
        
        var plugin = new Plugin("Ajax.org", main.consumes);
        var emit = plugin.getEmitter();
        
        var loaded = false;
        function load() {
            if (loaded) return false;
            loaded = true;
            
            settings.on("read", function(){
                settings.setDefaults("user/project_manager", [
                    ["project_name", "Project"],
                    ["project_path", "~/project"],
                    ["projects_path", "~/projects"]
                ]);
            }, plugin);
            
            var findTimeout = null;
            settings.on(SettingsKey.PROJECTS_PATH, function () {
                clearTimeout(findTimeout);
                findTimeout = setTimeout(function () {
                    getProjects();
                }, 1000);
            });
            
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
            
            changeProjectName();
            getProjects();
        }
        
        /***** Methods *****/
        
        /**
         * Change name for root directory of project
         */
        function changeProjectName() {
            tree.tree.provider.root.children[0].label = settings.get(SettingsKey.PROJECT_NAME);
            tree.refresh();
        }
        
        /**
         * Fix user settings for project directories
         * 
         * @param {string} directoryPath
         */
        function fixDirectoryPath(directoryPath) {
            var value = directoryPath.replace(/^[ \t]+|[ \t]+$/g, '');
            value.charAt(0) !== '~' && (value = '~' + value);
            value.charAt(1) !== '/' && (value = '/' + value);
            return value;
        }
        
        /**
         * Get all projects and push to menu
         */
        function getProjects() {
            if (menu) {
                var items = menu.childNodes || [];
                for (var i = items.length - 1; i >= 0; i--) {
                    menu.removeChild(items[i])
                }
            } else {
                menu = new ui.menu({
                    onitemclick: function(e) {
                        if (e.value && e.value !== "auto") {
                            openProject(e.value);
                        }
                    }
                });
                
                menus.addItemByPath("File/Open Project/", menu, 501, plugin);
            }
            
            const paths = settings.get(SettingsKey.PROJECTS_PATH).split(':');
            paths.forEach(function (directory, index) {
                directory = fixDirectoryPath(directory);
                fs.readdir(directory, function (err, files) {
                    if (err) {
                        console.warn(err);
                        return;
                    }
                    
                    menu.appendChild(new ui.divider());
                    menu.appendChild(new ui.item({
                        caption: directory,
                        value: directory
                    }));
                        
                    if (!files.length) {
                        menu.appendChild(new ui.item({
                            caption: 'empty folder',
                            value: 'auto',
                            disable: true
                        }));
                    }
                    
                    files.forEach(function (file) {
                        if (!/directory$/.test(file.mime)
                                || file.name.charAt(0) === '.') {
                            return;
                        }
                        
                        let filePath = PATH.join(directory, file.name);
                        menu.appendChild(new ui.item({
                            caption: filePath,
                            value: filePath
                        }));
                    });
                });
            });
        }
        
        /**
         * Open project
         * 
         * @param {string} projectName  directory name of project
         */
        function openProject(projectDir) {
            var projectName = projectDir.split('/').slice(-1)[0];
            
            closeProject(function () {
                fs.symlink(
                    fixDirectoryPath(settings.get(SettingsKey.PROJECT_PATH)),
                    projectDir,
                    function (err, data) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        
                        settings.set(SettingsKey.PROJECT_NAME, projectName);
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
            menu = null;
        });
        
        
        register(null, {
            projectmanager: plugin
        });
    }
});