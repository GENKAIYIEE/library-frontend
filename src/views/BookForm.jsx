import { useEffect, useState, useRef } from "react";
import { useToast } from "../components/ui/Toast";
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
  const toast = useToast();
  // Form is always in 'details' mode now

  const [book, setBook] = useState({
    title: "",
    subtitle: "",
    author: "",
    category: "Book",
    isbn: "",
    accession_no: "",
    lccn: "",
    issn: "",
    publisher: "",
    place_of_publication: "",
    published_year: "",
    copyright_year: "",
    call_number: "",
    pages: "",
    physical_description: "",
    edition: "",
    series: "",
    volume: "",
    price: "",
    book_penalty: "",
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
        subtitle: bookToEdit.subtitle || "",
        author: bookToEdit.author || "",
        category: bookToEdit.category || "",
        isbn: bookToEdit.isbn || "",
        accession_no: bookToEdit.accession_no || "",
        lccn: bookToEdit.lccn || "",
        issn: bookToEdit.issn || "",
        publisher: bookToEdit.publisher || "",
        place_of_publication: bookToEdit.place_of_publication || "",
        published_year: bookToEdit.published_year || "",
        copyright_year: bookToEdit.copyright_year || "",
        call_number: bookToEdit.call_number || "",
        pages: bookToEdit.pages || "",
        physical_description: bookToEdit.physical_description || "",
        edition: bookToEdit.edition || "",
        series: bookToEdit.series || "",
        volume: bookToEdit.volume || "",
        price: bookToEdit.price || "",
        book_penalty: bookToEdit.book_penalty || "",
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
    if (book.subtitle) formData.append("subtitle", book.subtitle);
    formData.append("author", book.author);
    formData.append("category", book.category);

    // Only append optional fields if they have values
    if (book.isbn) formData.append("isbn", book.isbn);
    if (book.accession_no) formData.append("accession_no", book.accession_no);
    if (book.lccn) formData.append("lccn", book.lccn);
    if (book.issn) formData.append("issn", book.issn);
    if (book.publisher) formData.append("publisher", book.publisher);
    if (book.place_of_publication) formData.append("place_of_publication", book.place_of_publication);
    if (book.published_year) formData.append("published_year", book.published_year);
    if (book.copyright_year) formData.append("copyright_year", book.copyright_year);
    if (book.call_number) formData.append("call_number", book.call_number);
    if (book.pages) formData.append("pages", book.pages);
    if (book.physical_description) formData.append("physical_description", book.physical_description);
    if (book.edition) formData.append("edition", book.edition);
    if (book.series) formData.append("series", book.series);
    if (book.volume) formData.append("volume", book.volume);
    if (book.price) formData.append("price", book.price);
    if (book.book_penalty) formData.append("book_penalty", book.book_penalty);
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
      axiosClient.post(`/books/${bookToEdit.id}`, formData)
        .then(() => {
          toast.success("Book updated successfully");
          onSuccess(book); // Pass back updated data if needed, or just trigger refresh
          onClose();
        })
        .catch(err => {
          setLoading(false);
          console.error(err);
          toast.error("Failed to update book");
        });
    } else {
      // CREATE MODE - Barcode auto-generated in backend
      axiosClient.post("/books/title", formData)
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
            toast.error("Validation Error: " + errorMessages);
          } else {
            toast.error("Failed to create book. Please check your network connection.");
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

            {/* Form Fields: Strict Order as Requested */}
            <div className="space-y-4">

              {/* 1. Category */}
              <FloatingSelect
                label="Category"
                value={book.category}
                onChange={e => setBook({ ...book, category: e.target.value })}
                required
              >
                <option value="Article">Article</option>
                <option value="Book">Book</option>
                <option value="Computer File/Electronic Resources">Computer File/Electronic Resources</option>
                <option value="Map">Map</option>
                <option value="Thesis">Thesis</option>
                <option value="Visual Materials">Visual Materials</option>
              </FloatingSelect>

              {/* 2. Accession No. & 3. Call Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Accession No."
                  value={book.accession_no}
                  onChange={e => setBook({ ...book, accession_no: e.target.value })}
                  icon={Hash}
                />
                <FloatingInput
                  label="Call Number"
                  value={book.call_number}
                  onChange={e => setBook({ ...book, call_number: e.target.value })}
                  icon={Hash}
                />
              </div>

              {/* 4. Book Title */}
              <FloatingInput
                label="Book Title"
                value={book.title}
                onChange={e => setBook({ ...book, title: e.target.value })}
                icon={BookOpen}
                required
              />

              {/* 5. Subtitle (New) */}
              <FloatingInput
                label="Subtitle"
                value={book.subtitle || ""}
                onChange={e => setBook({ ...book, subtitle: e.target.value })}
                icon={BookOpen}
                placeholder="Optional"
              />

              {/* 6. Author */}
              <FloatingInput
                label="Author"
                value={book.author}
                onChange={e => setBook({ ...book, author: e.target.value })}
                icon={User}
                required
              />

              {/* 7. ISBN, 8. LCCN, 9. ISSN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FloatingInput
                  label="ISBN"
                  value={book.isbn}
                  onChange={e => setBook({ ...book, isbn: e.target.value })}
                  icon={Hash}
                  placeholder={bookToEdit ? "" : "Auto-generated if blank"}
                />
                <FloatingInput
                  label="LCCN"
                  value={book.lccn}
                  onChange={e => setBook({ ...book, lccn: e.target.value })}
                  icon={Hash}
                  placeholder="Library of Congress"
                />
                <FloatingInput
                  label="ISSN"
                  value={book.issn}
                  onChange={e => setBook({ ...book, issn: e.target.value })}
                  icon={Hash}
                  placeholder="Serial Number"
                />
              </div>

              {/* 10. Location & 11. Book Penalty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Location"
                  value={book.location}
                  onChange={e => setBook({ ...book, location: e.target.value })}
                  icon={MapPin}
                  placeholder="Shelf location"
                />
                <FloatingInput
                  label="Book Penalty (₱)"
                  value={book.book_penalty}
                  onChange={e => setBook({ ...book, book_penalty: e.target.value })}
                  icon={Tag}
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* 12. Publisher & 13. Place */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Publisher"
                  value={book.publisher}
                  onChange={e => setBook({ ...book, publisher: e.target.value })}
                  icon={Building2}
                />
                <FloatingInput
                  label="Place of Publication"
                  value={book.place_of_publication}
                  onChange={e => setBook({ ...book, place_of_publication: e.target.value })}
                  icon={MapPin}
                />
              </div>

              {/* 14. Physical Description & 15. Edition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Physical Description"
                  value={book.physical_description}
                  onChange={e => setBook({ ...book, physical_description: e.target.value })}
                  icon={FileText}
                  placeholder="e.g. 200p., ill."
                />
                <FloatingInput
                  label="Edition"
                  value={book.edition}
                  onChange={e => setBook({ ...book, edition: e.target.value })}
                  icon={FileText}
                  placeholder="e.g. 2nd Edition"
                />
              </div>

              {/* 16. Copyright & 17. Series */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Copyright Year"
                  value={book.copyright_year}
                  onChange={e => setBook({ ...book, copyright_year: e.target.value })}
                  icon={Calendar}
                  type="number"
                />
                <FloatingInput
                  label="Series"
                  value={book.series}
                  onChange={e => setBook({ ...book, series: e.target.value })}
                  icon={FileText}
                />
              </div>

              {/* 18. Copy & 19. Volume */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Copies (Items)"
                  value={book.copies} // Assuming 'copies' maps to 'Copy'
                  onChange={e => setBook({ ...book, copies: e.target.value })}
                  icon={Copy}
                  type="number"
                  min="1"
                // disabled={!!bookToEdit} // Usually copies are handled separately on updates, but kept here for input match
                />
                <FloatingInput
                  label="Volume"
                  value={book.volume}
                  onChange={e => setBook({ ...book, volume: e.target.value })}
                  icon={FileText}
                />
              </div>

              {/* 20. Price */}
              <FloatingInput
                label="Price (₱)"
                value={book.price}
                onChange={e => setBook({ ...book, price: e.target.value })}
                icon={Tag}
                type="number"
                step="0.01"
              />

              {/* 21. Remarks */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
                <textarea
                  value={book.description} // Using description for remarks
                  onChange={e => setBook({ ...book, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#020463] focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none text-gray-900"
                  placeholder="Additional remarks..."
                />
              </div>

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
