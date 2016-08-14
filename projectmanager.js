define(function(require, exports, module) {
    main.consumes = [
        "Plugin", "ui", "commands", "menus", "dialog.alert", "fs"
    ];
    main.provides = ["projectmanager"];
    return main;

    function main(options, imports, register) {
        var Plugin = imports.Plugin;
        var ui = imports.ui;
        var commands = imports.commands;
        var menus = imports.menus;
        var fs = imports.fs;
        
        /***** Initialization *****/
        
        var plugin = new Plugin("Ajax.org", main.consumes);
        var emit = plugin.getEmitter();
        
        var loaded = false;
        function load() {
            if (loaded) return false;
            loaded = true;
            
            commands.addCommand({
                name: "openproject",
                hint: "open c9 project in cloud9",
                msg: "open project",
                bindKey: { mac: "Command-O", win: "Ctrl-O" },
                exec: function(editor, args) {
                    console.log(editor, args);
                    // openProject(args.mode, editor, args.all);
                    // openProject('plapped.com');
                }
            }, plugin);
            
            // menus.addItemByPath("File/Open Project...", new ui.item({
            //     selected: true,
            //     value: "auto",
            //     command: "openproject"
            // }), 100, plugin);// menus.addItemByPath("File/Open Recent Project")
            
            getProjects();
        }
        
        /***** Methods *****/
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
            
            fs.readdir('~/projects/', function (err, files) {
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
                fs.symlink('~/project', '~/projects/' + projectName, function (err, data) {
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
        
        /***** Register and define API *****/
        
        /**
         * 
         **/
        plugin.freezePublicAPI({
            /**
             * 
             */
            getProjects: getProjects,
            
            /**
             * 
             */
            // addFormatter: addFormatter,
            
            _events: [
                /**
                 * @event format
                 * @param {Object} e
                 * @param {String} e.mode
                 */
                // "format"
            ]
        });
        
        register(null, {
            projectmanager: plugin
        });
    }
});