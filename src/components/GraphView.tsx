'use client';

import { useState, useEffect, useRef } from 'react';
import { Entry } from '@/lib/types';

interface Node {
  id: string;
  x: number;
  y: number;
  entry: Entry;
}

interface Link {
  source: string;
  target: string;
}

export default function GraphView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    if (entries.length > 0) {
      generateGraph();
    }
  }, [entries]);

  useEffect(() => {
    drawGraph();
  }, [nodes, links, selectedNode]);

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/entries?limit=100');
      if (response.ok) {
        const { entries } = await response.json();
        setEntries(entries);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create nodes with random positions for now
    // In a real implementation, you'd use UMAP or another dimensionality reduction technique
    const generatedNodes: Node[] = entries.map((entry, index) => ({
      id: entry.id,
      x: Math.random() * (width - 100) + 50,
      y: Math.random() * (height - 100) + 50,
      entry
    }));

    // Create links based on joins
    const generatedLinks: Link[] = [];
    entries.forEach(entry => {
      entry.metadata.joins.forEach(joinId => {
        if (entries.some(e => e.id === joinId)) {
          generatedLinks.push({
            source: entry.id,
            target: joinId
          });
        }
      });
    });

    setNodes(generatedNodes);
    setLinks(generatedLinks);
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw links
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);

      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = selectedNode?.id === node.id;

      ctx.beginPath();
      ctx.arc(node.x, node.y, isSelected ? 12 : 8, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? '#3b82f6' : '#60a5fa';
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#1e40af' : '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance <= 12;
    });

    setSelectedNode(clickedNode || null);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading graph...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Highlight Graph</h1>

      <div className="flex gap-8">
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
            onClick={handleCanvasClick}
          />

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p>Click on nodes to see details. Lines connect joined highlights.</p>
            <p>Total highlights: {nodes.length}</p>
            <p>Total connections: {links.length}</p>
          </div>
        </div>

        {selectedNode && (
          <div className="w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Selected Highlight</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Content:</p>
                <p className="text-sm">{selectedNode.entry.data}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Source:</p>
                <p className="text-sm text-blue-600 hover:underline cursor-pointer">
                  {selectedNode.entry.metadata.article}
                  {selectedNode.entry.metadata.section && ` > ${selectedNode.entry.metadata.section}`}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Created:</p>
                <p className="text-sm">{new Date(selectedNode.entry.created_at).toLocaleString()}</p>
              </div>

              {selectedNode.entry.metadata.joins.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Connections ({selectedNode.entry.metadata.joins.length}):
                  </p>
                  <div className="text-sm space-y-1">
                    {selectedNode.entry.metadata.joins.map(joinId => {
                      const joinedEntry = entries.find(e => e.id === joinId);
                      return (
                        <div key={joinId} className="text-xs text-gray-600 dark:text-gray-400">
                          {joinedEntry ? joinedEntry.data.substring(0, 50) + '...' : joinId}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedNode.entry.metadata.img_url && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Image:</p>
                  <img
                    src={selectedNode.entry.metadata.img_url}
                    alt="Entry image"
                    className="max-w-full rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}