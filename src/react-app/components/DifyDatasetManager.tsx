import React, { useState } from 'react';
import { useDifyApi, CreateDatasetRequest, DifyDataset } from '../../shared';

/**
 * Example React component demonstrating type-safe Dify API usage
 * Uses TanStack Query for caching and automatic state management
 */
export function DifyDatasetManager() {
  const {
    useKnowledgeList,
    createDataset,
    deleteDataset
  } = useDifyApi();

  const { data: datasets = [], isLoading: loading, error } = useKnowledgeList();

  const [formData, setFormData] = useState<CreateDatasetRequest>({
    name: '',
    description: '',
    permission: 'only_me'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createDataset.mutateAsync(formData);
      // Reset form - TanStack Query will automatically invalidate and refetch
      setFormData({ name: '', description: '', permission: 'only_me' });
    } catch (error) {
      console.error('Failed to create dataset:', error);
    }
  };

  const handleDelete = async (datasetId: string) => {
    if (confirm('Are you sure you want to delete this dataset?')) {
      try {
        await deleteDataset.mutateAsync(datasetId);
        // TanStack Query will automatically invalidate and refetch
      } catch (error) {
        console.error('Failed to delete dataset:', error);
      }
    }
  };

  if (loading) {
    return <div className="p-4">Loading datasets...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dify Dataset Manager</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <span className="block sm:inline">{error.message}</span>
        </div>
      )}

      {/* Create Dataset Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Create New Dataset</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Dataset Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={3}
            />
          </div>
          
          <div>
            <label htmlFor="permission" className="block text-sm font-medium text-gray-700">
              Permission
            </label>
            <select
              id="permission"
              value={formData.permission}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                permission: e.target.value as 'only_me' | 'all_team_members' | 'partial_members'
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="only_me">Only Me</option>
              <option value="all_team_members">All Team Members</option>
              <option value="partial_members">Partial Members</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={createDataset.isPending || !formData.name.trim()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {createDataset.isPending ? 'Creating...' : 'Create Dataset'}
          </button>
        </form>
      </div>

      {/* Datasets List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Existing Datasets</h2>
        </div>
        
        {datasets.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {datasets.map((dataset: DifyDataset) => (
              <div key={dataset.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{dataset.name}</h3>
                    {dataset.description && (
                      <p className="text-sm text-gray-500 mt-1">{dataset.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{dataset.document_count} documents</span>
                      <span>{dataset.word_count.toLocaleString()} words</span>
                      <span>Permission: {dataset.permission}</span>
                      <span>Created: {new Date(dataset.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(dataset.id)}
                    disabled={deleteDataset.isPending}
                    className="ml-4 text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                  >
                    {deleteDataset.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            No datasets found. Create your first dataset above.
          </div>
        )}
      </div>
    </div>
  );
}