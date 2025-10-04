'use client'

import { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react'
import * as d3 from 'd3'
import { UMAP } from 'umap-js'
import { Entry } from '@/lib/types'

interface UMAPVisualizationProps {
  entries: Entry[]
  onNodeClick: (entry: Entry) => void
  newlyAddedEntryId?: string
}

function UMAPVisualization({
  entries,
  onNodeClick,
  newlyAddedEntryId,
}: UMAPVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const entryCount = entries.length

  // Throttled zoom handler for better performance
  const handleZoom = useCallback((event: any, g: d3.Selection<SVGGElement, unknown, null, undefined>) => {
    // Clear existing timeout
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current)
    }

    // Apply transform immediately for responsiveness
    g.attr('transform', event.transform)

    // Throttle additional processing
    zoomTimeoutRef.current = setTimeout(() => {
      // Any heavy zoom-dependent operations can go here if needed
    }, 16) // ~60fps
  }, [])

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)

    return () => {
      window.removeEventListener('resize', updateDimensions)
      // Cleanup zoom timeout
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current)
      }
    }
  }, [])

  // Apply UMAP positioning
  const applyUMAPPositioning = useCallback((entries: Entry[]) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('UMAP positioning called with', entries.length, 'entries')
      }

      if (entries.length < 2) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Not enough entries, using centered position')
        }
        return entries.map((entry, index) => ({
          entry,
          position: [0, 0] as [number, number]
        }))
      }

      // Extract embeddings from your Entry type
      const validEntries: Entry[] = []
      const validEmbeddings: number[][] = []

      entries.forEach((entry, index) => {
        // Your entries have embeddings in the database as arrays
        const embedding = (entry as any).embedding

        console.log(`Entry ${entry.id}: embedding type=${typeof embedding}, isArray=${Array.isArray(embedding)}, length=${Array.isArray(embedding) ? embedding.length : 'N/A'}`)

        if (!Array.isArray(embedding) || embedding.length === 0) {
          console.warn(`Entry ${entry.id}: Invalid embedding - not an array or empty`, {
            type: typeof embedding,
            isArray: Array.isArray(embedding),
            length: embedding?.length,
            sample: embedding?.slice?.(0, 3)
          })
          return
        }

        // Validate that all values are numbers
        const validEmb = embedding.filter(val => typeof val === 'number' && !isNaN(val))
        if (validEmb.length !== embedding.length) {
          console.warn(`Entry ${entry.id}: filtered ${embedding.length - validEmb.length} invalid values from embedding`)
        }

        if (validEmb.length > 0) {
          console.log(`Entry ${entry.id}: Using embedding with ${validEmb.length} dimensions, sample:`, validEmb.slice(0, 5))
          validEntries.push(entry)
          validEmbeddings.push(validEmb)
        } else {
          console.warn(`Entry ${entry.id}: No valid embedding values`)
        }
      })

      console.log(`Using ${validEntries.length} entries with valid embeddings out of ${entries.length} total`)
      console.log('Embedding matrix size:', validEmbeddings.length, 'x', validEmbeddings[0]?.length)

      if (validEmbeddings.length < 2) {
        console.log('Not enough valid embeddings, using manual positioning')
        return entries.map((entry, index) => ({
          entry,
          position: [index * 100 - 50, 0] as [number, number]
        }))
      }

      // For 2 entries, use simple positioning
      if (validEmbeddings.length === 2) {
        return [
          { entry: validEntries[0], position: [-1, 0] as [number, number] },
          { entry: validEntries[1], position: [1, 0] as [number, number] }
        ]
      }

      // 2D UMAP parameters optimized for performance and spread
      const umap = new UMAP({
        nComponents: 2,
        nNeighbors: Math.min(8, Math.max(2, Math.floor(validEmbeddings.length * 0.1))),
        minDist: 0.3,
        spread: 2.0,
        nEpochs: Math.min(100, Math.max(50, validEmbeddings.length * 2)),
        learningRate: 1.0,
        random: Math.random,
      })

      console.log('Starting UMAP fit with real embeddings...')
      console.log('UMAP config:', {
        nComponents: 2,
        nNeighbors: Math.min(10, Math.max(2, Math.floor(validEmbeddings.length * 0.15))),
        minDist: 0.3,
        spread: 2.0,
        embeddingCount: validEmbeddings.length,
        embeddingDims: validEmbeddings[0]?.length
      })

      let positions
      try {
        positions = umap.fit(validEmbeddings)
        console.log('UMAP SUCCESS! Generated positions:', positions.length, 'First 3 positions:', positions.slice(0, 3))

        // Verify the positions look reasonable
        const xValues = positions.map(p => p[0])
        const yValues = positions.map(p => p[1])
        console.log('Position ranges:', {
          x: [Math.min(...xValues), Math.max(...xValues)],
          y: [Math.min(...yValues), Math.max(...yValues)]
        })
        console.log('First 3 actual positions:')
        positions.slice(0, 3).forEach((pos, i) => {
          console.log(`  Position ${i}: [${pos[0]}, ${pos[1]}]`)
        })

      } catch (error) {
        console.error('UMAP failed, using fallback positioning:', error)
        // Fallback to circle layout
        return validEntries.map((entry, index) => {
          const angle = (index / validEntries.length) * 2 * Math.PI
          return {
            entry,
            position: [Math.cos(angle), Math.sin(angle)] as [number, number]
          }
        })
      }

      // Return positioned entries (only those with valid embeddings)
      const positionedEntries = validEntries.map((entry, index) => ({
        entry,
        position: positions[index] || [0, 0] as [number, number]
      }))

      // Add entries without valid embeddings at random positions
      const remainingEntries = entries.filter(entry =>
        !validEntries.some(validEntry => validEntry.id === entry.id)
      )

      remainingEntries.forEach((entry, index) => {
        const angle = (index / remainingEntries.length) * 2 * Math.PI
        positionedEntries.push({
          entry,
          position: [Math.cos(angle) * 3, Math.sin(angle) * 3] as [number, number]
        })
      })

      return positionedEntries
    }, [])

  // Extract dependencies for memoization
  const entryIds = useMemo(() => entries.map(e => e.id).join(','), [entries])

  // Memoize UMAP positioning to avoid recalculation on every render
  const positionedEntries = useMemo(() => {
    if (!entries.length) return []

    if (process.env.NODE_ENV === 'development') {
      console.log('UMAP positioning memoized calculation with', entries.length, 'entries')
      console.log('Entry IDs:', entries.map(e => e.id).slice(0, 5))
    }
    return applyUMAPPositioning(entries)
  }, [entries.length, entryIds, applyUMAPPositioning])

  useEffect(() => {
    if (!svgRef.current || !positionedEntries.length || !dimensions.width) return

    console.log('UMAP visualization rendering with', positionedEntries.length, 'positioned entries')

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    if (positionedEntries.length === 0) {
      // Show message when no entries
      svg.append('text')
        .attr('x', dimensions.width / 2)
        .attr('y', dimensions.height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'gray')
        .attr('font-size', '18px')
        .text('No entries found')
      return
    }

    // Handle single entry case - just center it
    if (positionedEntries.length === 1) {
      const g = svg.append('g')

      const centerX = dimensions.width / 2
      const centerY = dimensions.height / 2

      const entry = positionedEntries[0].entry
      const node = g.append('g')
        .attr('class', 'node')
        .attr('transform', `translate(${centerX}, ${centerY})`)
        .style('cursor', 'pointer')
        .on('click', () => onNodeClick(entry))

      // Draw simple circle for highlight entries
      node.append('circle')
        .attr('r', 12)
        .attr('fill', '#3b82f6')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)

      // Add text label
      node.append('text')
        .attr('x', 0)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#333')
        .attr('font-weight', 'bold')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
        .text(truncateText(entry.data, 50))

      // Add hover effects
      node.on('mouseenter', function(event) {
        d3.select(this).select('circle').attr('stroke-width', 4)

        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px 12px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('max-width', '200px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .text(truncateText(entry.data))

        tooltip.style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px')
      })
      .on('mouseleave', function() {
        d3.select(this).select('circle').attr('stroke-width', 2)
        d3.selectAll('.tooltip').remove()
      })

      // Add text indicating single entry
      svg.append('text')
        .attr('x', dimensions.width / 2)
        .attr('y', dimensions.height - 50)
        .attr('text-anchor', 'middle')
        .attr('fill', 'gray')
        .attr('font-size', '14px')
        .text('Single entry - add more entries to see UMAP clustering')

      return
    }

    // Extract positions and entries from memoized positioned entries
    const umapResult = positionedEntries.map(({ position }) => position as [number, number])
    const flattenedEntries = positionedEntries.map(({ entry }) => entry)

    console.log(`Using ${positionedEntries.length} positioned entries`)

    // Create scales
    const xExtent = d3.extent(umapResult, d => d[0]) as [number, number]
    const yExtent = d3.extent(umapResult, d => d[1]) as [number, number]

    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([100, dimensions.width - 100])

    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([100, dimensions.height - 100])

    // Create main group with zoom/pan behavior
    const g = svg.append('g')

    // Add zoom and pan behavior with performance optimization
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        handleZoom(event, g)
      })

    // Apply zoom behavior to SVG with optimization
    svg.call(zoom)
      .on('wheel.zoom', (event) => {
        event.preventDefault()
      })

    // Add zoom controls hint
    svg.append('text')
      .attr('x', 10)
      .attr('y', dimensions.height - 10)
      .attr('fill', 'gray')
      .attr('font-size', '12px')
      .text('Drag to pan • Scroll to zoom')

    // Draw lines for joined entries
    flattenedEntries.forEach((entry, entryIndex) => {
      if (entry.metadata.joins && entry.metadata.joins.length > 0) {
        entry.metadata.joins.forEach(joinedId => {
          const joinedIndex = flattenedEntries.findIndex(e => e.id === joinedId)
          if (joinedIndex >= 0 && umapResult[joinedIndex] && umapResult[entryIndex]) {
            const [entryX, entryY] = umapResult[entryIndex]
            const [joinedX, joinedY] = umapResult[joinedIndex]

            g.append('line')
              .attr('x1', xScale(entryX))
              .attr('y1', yScale(entryY))
              .attr('x2', xScale(joinedX))
              .attr('y2', yScale(joinedY))
              .attr('stroke', '#94a3b8')
              .attr('stroke-width', 2)
              .attr('stroke-opacity', 0.6)
          }
        })
      }
    })

    // Draw nodes for all entries
    const nodes = g.selectAll('.node')
      .data(flattenedEntries.map((entry, i) => ({ entry, position: umapResult[i] })).filter(d => d.position))
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => {
        if (!d.position || d.position[0] === undefined || d.position[1] === undefined) {
          console.error('Invalid position for entry', d.entry.id, d.position)
          return 'translate(0, 0)'
        }
        return `translate(${xScale(d.position[0])}, ${yScale(d.position[1])})`
      })
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        onNodeClick(d.entry)
      })

    // Draw circles for highlight entries
    nodes.append('circle')
      .attr('r', d => {
        // Size based on number of joins
        const joinCount = d.entry.metadata.joins?.length || 0
        return Math.max(8, Math.min(20, 8 + joinCount * 2))
      })
      .attr('fill', d => {
        // Color based on article
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
        const hash = d.entry.metadata.article?.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0)
          return a & a
        }, 0) || 0
        return colors[Math.abs(hash) % colors.length]
      })
      .attr('stroke', d => d.entry.id === newlyAddedEntryId ? '#ff6b35' : '#fff')
      .attr('stroke-width', (d: any) => d.entry.id === newlyAddedEntryId ? 4 : 2)

    // Add hover effects
    nodes.on('mouseenter', function(event, d) {
      requestAnimationFrame(() => {
        d3.select(this).select('circle').attr('stroke-width', 4)

        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px 12px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('max-width', '300px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .style('transform', 'translateZ(0)')

        // Create tooltip content
        const tooltipContent = `
          <div><strong>${truncateText(d.entry.data, 100)}</strong></div>
          <div style="margin-top: 4px; font-size: 10px; opacity: 0.8;">
            From: ${d.entry.metadata.article}
            ${d.entry.metadata.section ? ` > ${d.entry.metadata.section}` : ''}
          </div>
          ${d.entry.metadata.joins && d.entry.metadata.joins.length > 0 ?
            `<div style="margin-top: 4px; font-size: 10px; opacity: 0.8;">
              Joins: ${d.entry.metadata.joins.length}
            </div>` : ''}
        `

        tooltip.html(tooltipContent)

        tooltip.style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px')
      })
    })
    .on('mouseleave', function() {
      requestAnimationFrame(() => {
        d3.select(this).select('circle').attr('stroke-width', (d: any) => d.entry.id === newlyAddedEntryId ? 4 : 2)
        d3.selectAll('.tooltip').remove()
      })
    })

  }, [positionedEntries, dimensions.width, dimensions.height, newlyAddedEntryId, onNodeClick])

  return (
    <div className="relative w-full h-full">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-2xl font-bold text-foreground">
          Knowledge Graph
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {entries.length} highlights • UMAP clustering
        </p>
      </div>

      {/* SVG visualization */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />
    </div>
  )
}

export default memo(UMAPVisualization)