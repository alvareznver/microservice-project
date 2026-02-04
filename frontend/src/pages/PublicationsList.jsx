import { useState, useEffect } from 'react';
import { publicationsAPI, authorsAPI } from '../services/api';
import './PublicationsList.css';

const STATUS_COLORS = {
  DRAFT: 'draft',
  IN_REVIEW: 'in-review',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
};

export default function PublicationsList({ onAlert }) {
  const [publications, setPublications] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    abstract_text: '',
    authorId: '',
    keywords: '',
  });

  const [statusChangeData, setStatusChangeData] = useState({
    publicationId: null,
    newStatus: '',
    reviewNotes: '',
  });

  useEffect(() => {
    loadPublications();
    loadAuthors();
  }, [currentPage, filterStatus]);

  const loadPublications = async () => {
    setLoading(true);
    try {
      const response = await publicationsAPI.list(
        currentPage,
        10,
        filterStatus || null
      );
      setPublications(response.data.data);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error loading publications:', error);
      onAlert('error', 'Failed to load publications');
    } finally {
      setLoading(false);
    }
  };

  const loadAuthors = async () => {
    try {
      const response = await authorsAPI.list(1, 100);
      setAuthors(response.data.data);
    } catch (error) {
      console.error('Error loading authors:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content || !formData.authorId) {
      onAlert('warning', 'Please fill in required fields');
      return;
    }

    const dataToSend = {
      ...formData,
      keywords: formData.keywords
        ? formData.keywords.split(',').map((k) => k.trim())
        : [],
    };

    setLoading(true);
    try {
      if (editingId) {
        await publicationsAPI.update(editingId, dataToSend);
        onAlert('success', 'Publication updated successfully');
        setEditingId(null);
      } else {
        await publicationsAPI.create(dataToSend);
        onAlert('success', 'Publication created successfully');
      }
      loadPublications();
      resetForm();
    } catch (error) {
      console.error('Error saving publication:', error);
      onAlert(
        'error',
        error.response?.data?.error?.message || 'Failed to save publication'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (publication) => {
    setEditingId(publication.id);
    setFormData({
      title: publication.title,
      content: publication.content,
      abstract_text: publication.abstract_text || '',
      authorId: publication.authorId,
      keywords: publication.keywords?.join(', ') || '',
    });
    setShowForm(true);
  };

  const handleChangeStatus = async (publicationId, newStatus, reviewNotes) => {
    setLoading(true);
    try {
      await publicationsAPI.changeStatus(publicationId, {
        status: newStatus,
        reviewNotes,
      });
      onAlert('success', `Publication status changed to ${newStatus}`);
      loadPublications();
      setStatusChangeData({
        publicationId: null,
        newStatus: '',
        reviewNotes: '',
      });
    } catch (error) {
      console.error('Error changing status:', error);
      onAlert(
        'error',
        error.response?.data?.error?.message || 'Failed to change status'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this publication?')) {
      setLoading(true);
      try {
        await publicationsAPI.delete(id);
        onAlert('success', 'Publication deleted successfully');
        loadPublications();
      } catch (error) {
        console.error('Error deleting publication:', error);
        onAlert('error', 'Failed to delete publication');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      abstract_text: '',
      authorId: '',
      keywords: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const getAuthorName = (authorId) => {
    const author = authors.find((a) => a.id === authorId);
    return author ? `${author.firstName} ${author.lastName}` : 'Unknown';
  };

  return (
    <div className="publications-container">
      <div className="section-header">
        <h2>📝 Publications Management</h2>
        <button
          className="primary"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : '+ New Publication'}
        </button>
      </div>

      <div className="filters">
        <label>Filter by Status:</label>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="APPROVED">Approved</option>
          <option value="PUBLISHED">Published</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {showForm && (
        <form className="publication-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Author *</label>
            <select
              name="authorId"
              value={formData.authorId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select an author</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.firstName} {author.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Content *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows="4"
              required
            />
          </div>
          <div className="form-group">
            <label>Abstract</label>
            <textarea
              name="abstract_text"
              value={formData.abstract_text}
              onChange={handleInputChange}
              rows="2"
            />
          </div>
          <div className="form-group">
            <label>Keywords (comma-separated)</label>
            <input
              type="text"
              name="keywords"
              value={formData.keywords}
              onChange={handleInputChange}
              placeholder="e.g., AI, Machine Learning, Python"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={resetForm}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && !showForm ? (
        <div className="loading">Loading publications...</div>
      ) : publications.length > 0 ? (
        <>
          <div className="publications-list">
            {publications.map((publication) => (
              <div key={publication.id} className="publication-card">
                <div className="card-header">
                  <h3>{publication.title}</h3>
                  <span
                    className={`badge ${
                      STATUS_COLORS[publication.status]
                    }`}
                  >
                    {publication.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="card-body">
                  <p>
                    <strong>Author:</strong>{' '}
                    {publication.authorName || getAuthorName(publication.authorId)}
                  </p>
                  <p>
                    <strong>Abstract:</strong> {publication.abstract_text || 'N/A'}
                  </p>
                  {publication.keywords?.length > 0 && (
                    <p>
                      <strong>Keywords:</strong>{' '}
                      {publication.keywords.join(', ')}
                    </p>
                  )}
                  <p className="content-preview">
                    <strong>Content:</strong> {publication.content.substring(0, 100)}
                    {publication.content.length > 100 ? '...' : ''}
                  </p>
                  {publication.reviewNotes && (
                    <p>
                      <strong>Review Notes:</strong> {publication.reviewNotes}
                    </p>
                  )}
                </div>
                <div className="card-footer">
                  <div className="action-buttons">
                    {publication.status !== 'PUBLISHED' &&
                      publication.status !== 'REJECTED' && (
                        <button
                          className="primary"
                          onClick={() => handleEdit(publication)}
                        >
                          Edit
                        </button>
                      )}
                    <button
                      className="warning"
                      onClick={() => {
                        setStatusChangeData({
                          publicationId: publication.id,
                          newStatus: '',
                          reviewNotes: '',
                        });
                      }}
                    >
                      Change Status
                    </button>
                    {publication.status !== 'PUBLISHED' && (
                      <button
                        className="danger"
                        onClick={() => handleDelete(publication.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {statusChangeData.publicationId === publication.id && (
                  <div className="status-change-form">
                    <h4>Change Publication Status</h4>
                    <select
                      value={statusChangeData.newStatus}
                      onChange={(e) =>
                        setStatusChangeData((prev) => ({
                          ...prev,
                          newStatus: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select new status</option>
                      <option value="DRAFT">Draft</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                    <textarea
                      placeholder="Review Notes (required)"
                      value={statusChangeData.reviewNotes}
                      onChange={(e) =>
                        setStatusChangeData((prev) => ({
                          ...prev,
                          reviewNotes: e.target.value,
                        }))
                      }
                      rows="2"
                    />
                    <div className="status-form-actions">
                      <button
                        className="primary"
                        onClick={() =>
                          handleChangeStatus(
                            statusChangeData.publicationId,
                            statusChangeData.newStatus,
                            statusChangeData.reviewNotes
                          )
                        }
                        disabled={
                          !statusChangeData.newStatus ||
                          !statusChangeData.reviewNotes
                        }
                      >
                        Save Status
                      </button>
                      <button
                        className="secondary"
                        onClick={() =>
                          setStatusChangeData({
                            publicationId: null,
                            newStatus: '',
                            reviewNotes: '',
                          })
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages} (Total: {total})
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="empty-state">
          No publications found. Create one!
        </div>
      )}
    </div>
  );
}
