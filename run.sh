#!/bin/bash

if [ -f _config_local.yml ]; then
  bundle exec jekyll serve --livereload --config _config.yml,_config_local.yml
else
  bundle exec jekyll serve --livereload
fi
