module.exports = function(grunt) {

  grunt.initConfig({
    less: {
      hi: {
        options: {
//          cleancss: true,
          modifyVars: {
            imgPath: '"http://mycdn.com/path/to/images"',
            "brand-primary": 'red'
          }
        },
        files: {
          "test/css/grunt-export.css": "public/less/*.less"
        }
      }
    },
    jade: {
      options: {
        pretty: true
      },
      hi: {
        options: {
          data: { message: ''},
          client: true

        },
        files: {
          "test/jade/output.js" : "views/sale/download.jade"
        }
      }
    }
  });


  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-jade');
  // Default task(s).
  grunt.registerTask('default', ['uglify']);

};