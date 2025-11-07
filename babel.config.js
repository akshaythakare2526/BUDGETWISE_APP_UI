module.exports = function (api) {
  api.cache(true);
  
  const plugins = [
    // ... other plugins
  ];

  // Remove console.log in production builds
  if (process.env.NODE_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'react' }]
    ],
    plugins,
  };
};
