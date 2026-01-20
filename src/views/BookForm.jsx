import { useEffect, useState, useRef } from "react";
import axiosClient, { ASSET_URL } from "../axios-client";
import Swal from "sweetalert2";
import {
  Scan, X, BookOpen, User, Tag, Building2, Calendar,
  Hash, FileText, Globe, MapPin, Image, Copy, Upload, Search, Loader2, CheckCircle
} from "lucide-react";
import FloatingInput from "../components/ui/FloatingInput";
import FloatingSelect from "../components/ui/FloatingSelect";
import Button from "../components/ui/Button";

export default function BookForm({ onClose, onSuccess, bookToEdit, prefillBarcode = "" }) {
  // Form is always in 'details' mode now

  const [book, setBook] = useState({
    title: "",
    author: "",
    category: "Fiction",
    isbn: "",
    publisher: "",
    published_year: "",
    call_number: "",
    pages: "",
    language: "English",
    description: "",
    location: "",
    copies: "1"
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Track if barcode was pre-filled from scanner
  const [isFromScanner, setIsFromScanner] = useState(false);

  // If we are editing, fill the form with the existing data
  useEffect(() => {
    if (bookToEdit) {
      setBook({
        title: bookToEdit.title || "",
        author: bookToEdit.author || "",
        category: bookToEdit.category || "",
        isbn: bookToEdit.isbn || "",
        publisher: bookToEdit.publisher || "",
        published_year: bookToEdit.published_year || "",
        call_number: bookToEdit.call_number || "",
        pages: bookToEdit.pages || "",
        language: bookToEdit.language || "English",
        description: bookToEdit.description || "",
        location: bookToEdit.location || "",
        copies: "0" // Not editable for existing books
      });
      // Set image preview if book has existing image
      if (bookToEdit.image_path) {
        setImagePreview(`${ASSET_URL}/${bookToEdit.image_path}`);
      }
    }
  }, [bookToEdit]);

  // Pre-fill barcode from scanner
  useEffect(() => {
    if (prefillBarcode && !bookToEdit) {
      setBook(prev => ({ ...prev, isbn: prefillBarcode }));
      setIsFromScanner(true);
    }
  }, [prefillBarcode, bookToEdit]);

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    setLoading(true);

    // Create FormData for file upload
    // Create FormData for file upload
    const formData = new FormData();
    formData.append("title", book.title);
    formData.append("author", book.author);
    formData.append("category", book.category);

    // Only append optional fields if they have values
    if (book.isbn) formData.append("isbn", book.isbn);
    if (book.publisher) formData.append("publisher", book.publisher);
    if (book.published_year) formData.append("published_year", book.published_year);
    if (book.call_number) formData.append("call_number", book.call_number);
    if (book.pages) formData.append("pages", book.pages);
    if (book.language) formData.append("language", book.language);
    if (book.description) formData.append("description", book.description);
    if (book.location) formData.append("location", book.location);

    if (!bookToEdit) {
      formData.append("copies", book.copies || "1");
    }

    if (imageFile) {
      formData.append("image", imageFile);
    }

    if (bookToEdit) {
      // UPDATE MODE - Use POST with _method for Laravel
      formData.append("_method", "PUT");
      axiosClient.post(`/books/${bookToEdit.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
        .then(() => {
          onSuccess();
          onClose();
        })
        .catch(err => {
          setLoading(false);
          console.error(err);
          alert("Failed to update book");
        });
    } else {
      // CREATE MODE - Barcode auto-generated in backend
      axiosClient.post("/books/title", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
        .then((res) => {
          const newBook = res.data.book;
          const copiesCreated = res.data.copies_created || 0;
          const isbn = newBook?.isbn || 'Auto-generated';

          Swal.fire({
            icon: 'success',
            title: 'Book Added Successfully!',
            html: `
              <div style="text-align: left; padding: 10px 0;">
                <p><strong>Title:</strong> ${newBook?.title || book.title}</p>
                <p><strong>ISBN:</strong> <code style="background: #e3e8ee; padding: 2px 8px; border-radius: 4px;">${isbn}</code></p>
                <p><strong>Physical Copies:</strong> ${copiesCreated}</p>
                <hr style="margin: 10px 0; border-color: #e5e7eb;">
                <p style="color: #059669;">✅ Registered for scanner - Ready to borrow!</p>
              </div>
            `,
            confirmButtonColor: '#020463',
            confirmButtonText: 'Great!'
          });

          onSuccess(newBook);
          onClose();
        })
        .catch(err => {
          setLoading(false);
          console.error(err);
          const response = err.response;
          if (response && response.status === 422) {
            const errors = response.data.errors;
            const errorMessages = Object.values(errors).flat().join('\n');
            alert("Validation Error:\n" + errorMessages);
          } else {
            alert("Failed to create book. Please check your network connection or try again.");
          }
        });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#020463] px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BookOpen className="text-white" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {bookToEdit ? "Edit Book" : "Add New Book"}
              </h2>
              <p className="text-white/70 text-sm">
                {bookToEdit ? "Update book information" : "Complete book details"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition text-white/70 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Scanner indicator */}
          {isFromScanner && (
            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Scan className="text-[#020463]" size={20} />
              </div>
              <div>
                <p className="text-[#020463] font-bold text-sm">Registering from Scanner</p>
                <p className="text-blue-600 text-sm mt-0.5">
                  The ISBN has been pre-filled.
                </p>
              </div>
            </div>
          )}

          {/* Book Details Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload Section */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Book Cover Image</label>
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="w-32 h-40 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <Image className="mx-auto text-gray-400" size={32} />
                      <p className="text-xs text-gray-400 mt-1">No image</p>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="book-image"
                  />
                  <label
                    htmlFor="book-image"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#020463] rounded-lg cursor-pointer hover:bg-blue-100 transition font-medium text-sm"
                  >
                    <Upload size={16} />
                    Choose Image
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="ml-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 5MB</p>
                </div>
              </div>
            </div>

            {/* Basic Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingInput
                label="Book Title"
                value={book.title}
                onChange={e => setBook({ ...book, title: e.target.value })}
                icon={BookOpen}
                required
              />
              <FloatingInput
                label="Author"
                value={book.author}
                onChange={e => setBook({ ...book, author: e.target.value })}
                icon={User}
                required
              />
            </div>

            {/* ISBN and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingInput
                label="ISBN (Optional)"
                value={book.isbn}
                onChange={e => setBook({ ...book, isbn: e.target.value })}
                icon={Hash}
                placeholder={bookToEdit ? "" : "Auto-generated if left blank"}
              />
              <FloatingSelect
                label="Category"
                value={book.category}
                onChange={e => setBook({ ...book, category: e.target.value })}
                required
              >
                <option value="Fiction">Fiction</option>
                <option value="Technology">Technology</option>
                <option value="Science">Science</option>
                <option value="History">History</option>
                <option value="Education">Education</option>
                <option value="Literature">Literature</option>
                <option value="Reference">Reference</option>
                <option value="Business">Business</option>
                <option value="Arts">Arts</option>
                <option value="Religion">Religion</option>
                <option value="Philosophy">Philosophy</option>
                <option value="Law">Law</option>
                <option value="Medicine">Medicine</option>
                <option value="Engineering">Engineering</option>
                <option value="Maritime">Maritime</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Criminology">Criminology</option>
                <option value="Thesis">Thesis</option>
              </FloatingSelect>
            </div>

            {/* Publisher and Year Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingInput
                label="Publisher"
                value={book.publisher}
                onChange={e => setBook({ ...book, publisher: e.target.value })}
                icon={Building2}
              />
              <FloatingInput
                label="Published Year"
                value={book.published_year}
                onChange={e => setBook({ ...book, published_year: e.target.value })}
                icon={Calendar}
                type="number"
                min="1800"
                max={new Date().getFullYear() + 1}
              />
            </div>

            {/* Call Number and Pages Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingInput
                label="Call Number"
                value={book.call_number}
                onChange={e => setBook({ ...book, call_number: e.target.value })}
                icon={Hash}
              />
              <FloatingInput
                label="Pages"
                value={book.pages}
                onChange={e => setBook({ ...book, pages: e.target.value })}
                icon={FileText}
                type="number"
                min="1"
              />
            </div>

            {/* Language and Location Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingSelect
                label="Language"
                value={book.language}
                onChange={e => setBook({ ...book, language: e.target.value })}
              >
                <option value="English">English</option>
                <option value="Filipino">Filipino</option>
                <option value="Spanish">Spanish</option>
                <option value="Japanese">Japanese</option>
                <option value="Chinese">Chinese</option>
                <option value="Korean">Korean</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Other">Other</option>
              </FloatingSelect>
              <FloatingInput
                label="Default Location"
                value={book.location}
                onChange={e => setBook({ ...book, location: e.target.value })}
                icon={MapPin}
                placeholder="e.g., Shelf A1"
              />
            </div>

            {/* Copies - Only for new books */}
            {!bookToEdit && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Copy className="text-[#020463]" size={20} />
                  <span className="font-semibold text-[#020463]">Physical Copies</span>
                </div>
                <FloatingInput
                  label="Number of Copies"
                  value={book.copies}
                  onChange={e => setBook({ ...book, copies: e.target.value })}
                  icon={Copy}
                  type="number"
                  min="1"
                  max="100"
                  required
                />
                <p className="text-xs text-blue-600 mt-2">
                  System will auto-generate {book.copies || 0} unique barcode(s) for scanner tracking.
                </p>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={book.description}
                onChange={e => setBook({ ...book, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#020463] focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none text-gray-900"
                placeholder="Enter a brief description of the book..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="form"
                loading={loading}
                className="flex-1"
              >
                {bookToEdit ? "Save Changes" : "Save Book"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
