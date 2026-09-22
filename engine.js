/* LineOracle engine - pure queue-rate math, shared by app.html and node tests. */
(function(root, factory){
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LineOracleEngine = factory();
})(typeof self !== 'undefined' ? self : this, function(){

  /* timestamps: ascending ms times, one per "someone got served" tap */
  function intervalsMs(timestamps){
    var out = [];
    for (var i = 1; i < timestamps.length; i++) out.push(timestamps[i] - timestamps[i-1]);
    return out;
  }

  /* average service interval over the most recent `window` intervals */
  function avgIntervalMs(timestamps, window){
    var iv = intervalsMs(timestamps);
    if (!iv.length) return null;
    var w = Math.min(window || 6, iv.length);
    var slice = iv.slice(iv.length - w);
    var sum = 0;
    for (var i = 0; i < slice.length; i++) sum += slice[i];
    return sum / slice.length;
  }

  function stddev(nums){
    if (nums.length < 2) return 0;
    var m = 0;
    for (var i = 0; i < nums.length; i++) m += nums[i];
    m /= nums.length;
    var v = 0;
    for (var j = 0; j < nums.length; j++){ var d = nums[j] - m; v += d * d; }
    return Math.sqrt(v / (nums.length - 1));
  }

  /* projected wait for `ahead` people, in minutes; null until 2 taps */
  function projectWaitMin(ahead, timestamps, window){
    var avg = avgIntervalMs(timestamps, window);
    if (avg === null || ahead < 0) return null;
    return (ahead * avg) / 60000;
  }

  /* optimistic / pessimistic band from interval variability (coefficient of variation, capped) */
  function band(ahead, timestamps, window){
    var wait = projectWaitMin(ahead, timestamps, window);
    if (wait === null) return null;
    var iv = intervalsMs(timestamps);
    var w = Math.min(window || 6, iv.length);
    var slice = iv.slice(iv.length - w);
    var avg = 0;
    for (var i = 0; i < slice.length; i++) avg += slice[i];
    avg /= slice.length;
    var cv = avg > 0 ? Math.min(stddev(slice) / avg, 0.6) : 0;
    var low = wait * (1 - cv * 0.8);
    var high = wait * (1 + cv);
    return { wait: wait, low: Math.max(low, 0), high: high, cv: cv };
  }

  function etaMs(nowMs, waitMin){
    if (waitMin === null) return null;
    return nowMs + Math.round(waitMin * 60000);
  }

  function fmtMin(min){
    if (min === null) return '-';
    if (min < 1) return 'under a minute';
    var total = Math.round(min);
    if (total < 60) return 'about ' + total + ' min';
    var h = Math.floor(total / 60), m = total % 60;
    return 'about ' + h + ' h ' + (m < 10 ? '0' + m : m) + ' min';
  }

  function fmtInterval(ms){
    if (ms === null) return '-';
    var s = Math.round(ms / 1000);
    if (s < 90) return 'one person every ~' + s + ' sec';
    return 'one person every ~' + (ms / 60000).toFixed(1) + ' min';
  }

  function fmtClock(ms){
    if (ms === null) return '-';
    var d = new Date(ms);
    var h = d.getHours(), m = d.getMinutes();
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  }

  /* confidence label from sample size and variability */
  function confidence(timestamps, window){
    var iv = intervalsMs(timestamps);
    if (iv.length < 1) return null;
    if (iv.length === 1) return 'rough - first estimate';
    var w = Math.min(window || 6, iv.length);
    var slice = iv.slice(iv.length - w);
    var avg = 0;
    for (var i = 0; i < slice.length; i++) avg += slice[i];
    avg /= slice.length;
    var cv = avg > 0 ? stddev(slice) / avg : 0;
    if (iv.length >= 6 && cv < 0.25) return 'solid';
    if (iv.length >= 3 && cv < 0.5) return 'fair';
    return 'rough - line is jumpy';
  }

  return {
    intervalsMs: intervalsMs,
    avgIntervalMs: avgIntervalMs,
    stddev: stddev,
    projectWaitMin: projectWaitMin,
    band: band,
    etaMs: etaMs,
    fmtMin: fmtMin,
    fmtInterval: fmtInterval,
    fmtClock: fmtClock,
    confidence: confidence
  };
});
