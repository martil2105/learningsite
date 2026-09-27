<svelte:head>
  <title>LightGBM · Martin Le</title>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta
    name="description"
    content="A visual essay on the histogram trick behind LightGBM: how bucketing a feature into 255 bins turns split finding from a scan over rows into a scan over bins, what the subtraction trick buys, and what it costs in accuracy."
  />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="LightGBM" />
  <meta
    property="og:description"
    content="Stop looking at your data and look at a histogram of it instead. An interactive explanation of histogram-based split finding."
  />
</svelte:head>
