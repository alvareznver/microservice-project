import { useState, useEffect } from 'react';
import { authorsAPI } from '../services/api';
import './AuthorsList.css';

export default function AuthorsList({ onAlert }) {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    biography: '',
    specialization: '',
  });

  useEffect(() => {
    loadAuthors();
  }, [currentPage]);

  const loadAuthors = async () => {
    setLoading(true);
    try {
      const response = await authorsAPI.list(currentPage, 10);
      setAuthors(response.data.data);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.pages);
      onAlert('success', 'Authors loaded successfully');
    } catch (error) {
      console.error('Error loading authors:', error);
      onAlert('error', 'Failed to load authors');
    } finally {
      setLoading(false);
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

    if (!formData.firstName || !formData.lastName || !formData.email) {
      onAlert('warning', 'Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await authorsAPI.update(editingId, formData);
        onAlert('success', 'Author updated successfully');
        setEditingId(null);
      } else {
        await authorsAPI.create(formData);
        onAlert('success', 'Author created successfully');
      }
      loadAuthors();
      resetForm();
    } catch (error) {
      console.error('Error saving author:', error);
      onAlert(
        'error',
        error.response?.data?.error?.message || 'Failed to save author'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (author) => {
    setEditingId(author.id);
    setFormData({
      firstName: author.firstName,
      lastName: author.lastName,
      email: author.email,
      biography: author.biography || '',
      specialization: author.specialization || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this author?')) {
      setLoading(true);
      try {
        await authorsAPI.delete(id);
        onAlert('success', 'Author deleted successfully');
        loadAuthors();
      } catch (error) {
        console.error('Error deleting author:', error);
        onAlert('error', 'Failed to delete author');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      biography: '',
      specialization: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="authors-container">
      <div className="section-header">
        <h2>👥 Authors Management</h2>
        <button
          className="primary"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : '+ New Author'}
        </button>
      </div>

      {showForm && (
        <form className="author-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Biography</label>
            <textarea
              name="biography"
              value={formData.biography}
              onChange={handleInputChange}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Specialization</label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
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
        <div className="loading">Loading authors...</div>
      ) : authors.length > 0 ? (
        <>
          <table className="authors-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Specialization</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {authors.map((author) => (
                <tr key={author.id}>
                  <td>{author.firstName} {author.lastName}</td>
                  <td>{author.email}</td>
                  <td>{author.specialization || '-'}</td>
                  <td>
                    <span className={`badge ${author.isActive ? 'active' : 'inactive'}`}>
                      {author.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="primary"
                      onClick={() => handleEdit(author)}
                    >
                      Edit
                    </button>
                    <button
                      className="danger"
                      onClick={() => handleDelete(author.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        <div className="empty-state">No authors found. Create one!</div>
      )}
    </div>
  );
}
