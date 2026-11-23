import React, { useEffect, useRef } from 'react'
import { translations } from '../../i18n/translations'
import type { Language } from '../../i18n/translations'

interface NdviMapProps {
  district: {
    id: string
    name_en: string
    name_bn: string
    lat: number
    lon: number
  }
  ndviScore?: number
  lang?: Language
}

export const NdviMap: React.FC<NdviMapProps> = ({ district, ndviScore = 0.55, lang = 'bn' }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const polygonLayerRef = useRef<any>(null)

  const t = translations[lang]

  useEffect(() => {
    let isMounted = true

    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default || leafletModule
      if (!isMounted || !mapContainerRef.current) return

      if (!mapInstanceRef.current) {
        // Clear leaflet ID on DOM node if container was previously used
        if ((mapContainerRef.current as any)._leaflet_id) {
          (mapContainerRef.current as any)._leaflet_id = null
        }

        const map = L.map(mapContainerRef.current, {
          center: [district.lat, district.lon],
          zoom: 9,
          scrollWheelZoom: false
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map)

        mapInstanceRef.current = map
      }

      const map = mapInstanceRef.current
      map.invalidateSize()
      map.flyTo([district.lat, district.lon], 9, { duration: 1.2 })

      if (polygonLayerRef.current) {
        map.removeLayer(polygonLayerRef.current)
      }

      let fillColor = '#eab308'
      let statusText = t.mapPopupModerate
      if (ndviScore >= 0.60) {
        fillColor = '#22c55e'
        statusText = t.mapPopupHealthy
      } else if (ndviScore < 0.50) {
        fillColor = '#ef4444'
        statusText = t.mapPopupStressed
      }

      const dLat = 0.22
      const dLon = 0.25
      const lat = district.lat
      const lon = district.lon

      const coords: [number, number][] = [
        [lat - dLat, lon - dLon],
        [lat - dLat, lon + dLon],
        [lat + dLat, lon + dLon + 0.04],
        [lat + dLat, lon - dLon - 0.04]
      ]

      const poly = L.polygon(coords, {
        color: fillColor,
        weight: 2,
        opacity: 0.9,
        fillColor: fillColor,
        fillOpacity: 0.35
      }).addTo(map)

      const distTitle = lang === 'bn'
        ? `${district.name_bn} (${district.name_en})`
        : `${district.name_en} (${district.name_bn})`

      poly.bindPopup(`
        <div style="font-family: 'Hind Siliguri', 'Manrope', sans-serif; font-size: 13px; line-height: 1.4;">
          <strong style="color: #1b4d3e; font-size: 14px;">${distTitle}</strong><br/>
          <span>${t.mapPopupNdvi} <strong>${ndviScore.toFixed(2)}</strong></span><br/>
          <span style="color: ${fillColor}; font-weight: bold;">${statusText}</span>
        </div>
      `)

      polygonLayerRef.current = poly
    })

    return () => {
      isMounted = false
      if (polygonLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(polygonLayerRef.current)
      }
    }
  }, [district.id, ndviScore, lang])

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="relative w-full h-[320px] sm:h-[380px] rounded-xl overflow-hidden border border-[#d0d7cd]">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Legend Badge Overlay */}
      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm border border-[#d0d7cd] rounded-lg p-2.5 shadow-md z-[1000] text-xs">
        <p className="font-bold text-[#1c2826] mb-1.5 flex items-center gap-1">
          {t.mapLegendTitle}
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#22c55e]"></span>
            <span className="text-[#43544f]">{t.mapLegendGreen}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#eab308]"></span>
            <span className="text-[#43544f]">{t.mapLegendYellow}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ef4444]"></span>
            <span className="text-[#43544f]">{t.mapLegendRed}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
