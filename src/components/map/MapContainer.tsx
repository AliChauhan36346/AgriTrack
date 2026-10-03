import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Crosshair, Layers, Plus, Minus } from 'lucide-react-native';
import { FieldOfficer } from '../../types';
import { colors } from '../../theme/colors';
import { elevation } from '../../theme/elevation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MapContainerProps {
  children?: React.ReactNode;
  officers?: FieldOfficer[];
  selectedOfficerId?: string;
  onOfficerSelect?: (officerId: string) => void;
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  activeMarkerPosition?: { latitude: number; longitude: number };
  style?: StyleProp<ViewStyle>;
  height?: number;
  initialCenter?: { latitude: number; longitude: number };
}

export const MapContainer: React.FC<MapContainerProps> = ({
  children,
  officers = [],
  selectedOfficerId,
  onOfficerSelect,
  routeCoordinates,
  activeMarkerPosition,
  style,
  height = 480,
  initialCenter,
}) => {
  const webViewRef = useRef<WebView>(null);

  // Compute map center from selected officer, initialCenter, or average of officers
  const centerLat = useMemo(() => {
    if (activeMarkerPosition) return activeMarkerPosition.latitude;
    if (selectedOfficerId) {
      const selected = officers.find((o) => o.id === selectedOfficerId);
      if (selected?.currentLocation) return selected.currentLocation.latitude;
    }
    if (initialCenter) return initialCenter.latitude;
    if (officers.length > 0 && officers[0].currentLocation) {
      return officers[0].currentLocation.latitude;
    }
    return 30.1984; // Multan / Punjab default
  }, [officers, selectedOfficerId, activeMarkerPosition, initialCenter]);

  const centerLng = useMemo(() => {
    if (activeMarkerPosition) return activeMarkerPosition.longitude;
    if (selectedOfficerId) {
      const selected = officers.find((o) => o.id === selectedOfficerId);
      if (selected?.currentLocation) return selected.currentLocation.longitude;
    }
    if (initialCenter) return initialCenter.longitude;
    if (officers.length > 0 && officers[0].currentLocation) {
      return officers[0].currentLocation.longitude;
    }
    return 71.4687; // Multan default
  }, [officers, selectedOfficerId, activeMarkerPosition, initialCenter]);

  const isMapReadyRef = useRef<boolean>(false);

  // Send officers update to WebView via JavaScript Bridge without reloading
  const pushOfficersToMap = () => {
    if (!isMapReadyRef.current || !webViewRef.current) return;
    const officersData = officers.map((o) => ({
      id: o.id,
      name: o.fullName || o.name || 'Officer',
      lat: o.currentLocation?.latitude || 30.1984,
      lng: o.currentLocation?.longitude || 71.4687,
      speed: o.speedKmh || 0,
      heading: o.currentLocation?.heading || 0,
      status: o.currentStatus || 'offline',
      todayKm: o.todayDistanceKm || 0,
    }));
    const js = `window.updateOfficers && window.updateOfficers(${JSON.stringify(officersData)}, "${selectedOfficerId || ''}"); true;`;
    webViewRef.current.injectJavaScript(js);
  };

  // Push route polyline update to WebView
  const pushRouteToMap = () => {
    if (!isMapReadyRef.current || !webViewRef.current) return;
    const routeData = (routeCoordinates || []).map((c) => [c.latitude, c.longitude]);
    const js = `window.updateRoute && window.updateRoute(${JSON.stringify(routeData)}); true;`;
    webViewRef.current.injectJavaScript(js);
  };

  // Push playback dot position
  const pushPlaybackDotToMap = () => {
    if (!isMapReadyRef.current || !webViewRef.current) return;
    const activePos = activeMarkerPosition
      ? [activeMarkerPosition.latitude, activeMarkerPosition.longitude]
      : null;
    const js = `window.updatePlaybackMarker && window.updatePlaybackMarker(${JSON.stringify(activePos)}); true;`;
    webViewRef.current.injectJavaScript(js);
  };

  useEffect(() => {
    pushOfficersToMap();
  }, [officers, selectedOfficerId]);

  useEffect(() => {
    pushRouteToMap();
  }, [routeCoordinates]);

  useEffect(() => {
    pushPlaybackDotToMap();
  }, [activeMarkerPosition]);

  // Generate Leaflet HTML once (does not reload on marker movements)
  const leafletHtml = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #F1F5E9; overflow: hidden; }
    
    /* Ride App Marker Styling */
    .ride-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    
    .speed-pill {
      background: #FFFFFF;
      border-radius: 12px;
      padding: 2px 7px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10px;
      font-weight: 700;
      color: #0F172A;
      box-shadow: 0 2px 5px rgba(0,0,0,0.25);
      border: 1.5px solid #10B981;
      white-space: nowrap;
      margin-bottom: 3px;
    }
    .speed-pill.stopped {
      border-color: #F59E0B;
      color: #78350F;
    }
    .speed-pill.offline {
      border-color: #94A3B8;
      color: #475569;
      background: #F1F5F9;
    }
    .speed-pill.selected {
      background: #0F172A;
      color: #FFFFFF;
      border-color: #22C55E;
    }
    
    .puck-container {
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Radar wave pulse halo for active vehicles */
    .radar-pulse {
      position: absolute;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(34, 197, 94, 0.4);
      border: 1.5px solid rgba(34, 197, 94, 0.7);
      animation: pulseWave 2s infinite ease-out;
    }
    @keyframes pulseWave {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(1.9); opacity: 0; }
    }
    
    .vehicle-disc {
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #16A34A;
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 3px 8px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 5;
    }
    .vehicle-disc.stopped {
      background: #D97706;
    }
    .vehicle-disc.offline {
      background: #94A3B8;
    }
    .vehicle-disc.selected {
      transform: scale(1.1);
      box-shadow: 0 0 0 3px #3B82F6, 0 4px 10px rgba(0,0,0,0.4);
    }
    
    /* Smooth live moving marker gliding animation (Uber / Careem style) */
    .leaflet-marker-icon {
      transition: transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1) !important;
    }

    .vehicle-arrow {
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 12px solid #FFFFFF;
      margin-top: -2px;
      transition: transform 0.6s ease-out;
    }
    
    .name-badge {
      background: rgba(15, 23, 42, 0.88);
      color: #FFFFFF;
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 6px;
      margin-top: 2px;
      white-space: nowrap;
      font-family: sans-serif;
    }

    /* Active moving live playback dot */
    .playback-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #2563EB;
      border: 3px solid #FFFFFF;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${centerLat}, ${centerLng}], 13);

    // CartoDB Voyager OpenStreetMap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    var markersLayer = L.layerGroup().addTo(map);
    var markersMap = {};
    var routePolyline = null;
    var routeGlow = null;
    var playbackMarker = null;

    function buildOfficerIcon(officer, isSelected) {
      var isMoving = officer.speed > 0;
      var isOffline = officer.status === 'offline';

      var speedText = isOffline ? 'Offline' : (isMoving ? officer.speed + ' km/h' : 'Stopped');
      var pillClass = isOffline ? 'offline' : (isMoving ? '' : 'stopped');
      if (isSelected) pillClass += ' selected';
      var discClass = isOffline ? 'offline' : (isMoving ? '' : 'stopped');
      if (isSelected) discClass += ' selected';

      var radarHtml = (isMoving && !isOffline) ? '<div class="radar-pulse"></div>' : '';
      var rotation = officer.heading || 0;

      var html = '<div class="ride-marker" onclick="selectOfficer(\\'' + officer.id + '\\')">' +
        '<div class="speed-pill ' + pillClass + '">' + speedText + '</div>' +
        '<div class="puck-container">' +
          radarHtml +
          '<div class="vehicle-disc ' + discClass + '">' +
            '<div class="vehicle-arrow" style="transform: rotate(' + rotation + 'deg);"></div>' +
          '</div>' +
        '</div>' +
        '<div class="name-badge">' + (officer.name.split(' ')[0] || officer.name) + '</div>' +
      '</div>';

      return L.divIcon({
        html: html,
        className: '',
        iconSize: [80, 75],
        iconAnchor: [40, 50]
      });
    }

    // Dynamic marker update without page reload
    window.updateOfficers = function(officersList, selectedId) {
      if (!officersList) return;
      var currentIds = {};
      var bounds = [];

      officersList.forEach(function(officer) {
        currentIds[officer.id] = true;
        bounds.push([officer.lat, officer.lng]);
        var isSelected = officer.id === selectedId;
        var icon = buildOfficerIcon(officer, isSelected);

        if (markersMap[officer.id]) {
          // Smooth glide transition to new GPS coordinate!
          markersMap[officer.id].setIcon(icon);
          markersMap[officer.id].setLatLng([officer.lat, officer.lng]);
        } else {
          var marker = L.marker([officer.lat, officer.lng], { icon: icon });
          marker.on('click', function() {
            selectOfficer(officer.id);
          });
          markersLayer.addLayer(marker);
          markersMap[officer.id] = marker;
        }
      });

      // Remove vanished officers
      Object.keys(markersMap).forEach(function(id) {
        if (!currentIds[id]) {
          markersLayer.removeLayer(markersMap[id]);
          delete markersMap[id];
        }
      });

      if (bounds.length > 1 && !selectedId) {
        try {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        } catch(e) {}
      }
    };

    window.updateRoute = function(routeCoords) {
      if (routePolyline) {
        map.removeLayer(routePolyline);
        routePolyline = null;
      }
      if (routeGlow) {
        map.removeLayer(routeGlow);
        routeGlow = null;
      }
      if (routeCoords && routeCoords.length > 1) {
        routePolyline = L.polyline(routeCoords, {
          color: '#2563EB',
          weight: 6,
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(map);

        routeGlow = L.polyline(routeCoords, {
          color: '#93C5FD',
          weight: 12,
          opacity: 0.5,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(map);

        map.fitBounds(routePolyline.getBounds(), { padding: [30, 30] });
      }
    };

    window.updatePlaybackMarker = function(activePos) {
      if (!activePos) {
        if (playbackMarker) {
          map.removeLayer(playbackMarker);
          playbackMarker = null;
        }
        return;
      }
      var dotIcon = L.divIcon({
        html: '<div class="playback-dot"></div>',
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      if (playbackMarker) {
        playbackMarker.setLatLng(activePos);
      } else {
        playbackMarker = L.marker(activePos, { icon: dotIcon }).addTo(map);
      }
    };

    function selectOfficer(id) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SELECT_OFFICER',
          officerId: id
        }));
      }
    }

    window.flyToOfficer = function(lat, lng) {
      map.flyTo([lat, lng], 16, { animate: true, duration: 1 });
    };

    window.zoomInMap = function() {
      map.zoomIn();
    };

    window.zoomOutMap = function() {
      map.zoomOut();
    };

    window.recenterMap = function() {
      map.setView([${centerLat}, ${centerLng}], 14);
    };

    // Notify React Native that map is ready to receive data
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
    }
  </script>
</body>
</html>
    `;
  }, [centerLat, centerLng]);

  // Handle message from Leaflet Web
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        isMapReadyRef.current = true;
        pushOfficersToMap();
        pushRouteToMap();
        pushPlaybackDotToMap();
      } else if (data.type === 'SELECT_OFFICER' && data.officerId) {
        onOfficerSelect?.(data.officerId);
      }
    } catch {
      // Ignored
    }
  };

  const handleZoomIn = () => {
    webViewRef.current?.injectJavaScript('window.zoomInMap(); true;');
  };

  const handleZoomOut = () => {
    webViewRef.current?.injectJavaScript('window.zoomOutMap(); true;');
  };

  const handleRecenter = () => {
    webViewRef.current?.injectJavaScript(`window.recenterMap(); true;`);
  };

  return (
    <View style={[styles.container, { height }, style]}>
      {/* Real Interactive Leaflet / OpenStreetMap WebView */}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={false}
        scrollEnabled={false}
        onLoadEnd={() => {
          isMapReadyRef.current = true;
          pushOfficersToMap();
          pushRouteToMap();
          pushPlaybackDotToMap();
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading Live Real Map...</Text>
          </View>
        )}
        onMessage={handleMessage}
        style={styles.webView}
      />

      {/* Floating Map Controls (Recenter, Zoom In/Out) */}
      <View style={styles.topRightControls}>
        <TouchableOpacity
          style={[styles.controlButton, elevation.md]}
          onPress={handleRecenter}
          activeOpacity={0.7}
          accessibilityLabel="Recenter map"
        >
          <Crosshair size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomRightControls}>
        <TouchableOpacity
          style={[styles.controlButton, elevation.md]}
          onPress={handleZoomIn}
          activeOpacity={0.7}
          accessibilityLabel="Zoom in"
        >
          <Plus size={18} color={colors.neutralDark} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, elevation.md, { marginTop: 6 }]}
          onPress={handleZoomOut}
          activeOpacity={0.7}
          accessibilityLabel="Zoom out"
        >
          <Minus size={18} color={colors.neutralDark} />
        </TouchableOpacity>
      </View>

      {/* Live Map Telemetry watermark */}
      <View style={styles.attributionBadge}>
        <View style={styles.liveGreenDot} />
        <Text style={styles.attributionText}>OpenStreetMap • Live GPS Tiles</Text>
      </View>

      {/* Embedded Children */}
      {children && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#F1F5E9',
    position: 'relative',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#F1F5E9',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F1F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  topRightControls: {
    position: 'absolute',
    top: 68,
    right: 14,
    zIndex: 20,
  },
  bottomRightControls: {
    position: 'absolute',
    bottom: 16,
    right: 14,
    zIndex: 20,
  },
  controlButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  attributionBadge: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    zIndex: 20,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  attributionText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
});
