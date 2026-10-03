'use client';

import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';

export default function TinyEditor({ value, onChange }) {
    const editorRef = useRef(null);

    return (
        <Editor
            apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
            onInit={(_evt, editor) => (editorRef.current = editor)}
            value={value}
            onEditorChange={(newValue) => onChange(newValue)}
            init={{
                height: 500,
                menubar: 'file edit view insert format tools table help',
                plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
                    'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons'
                ],
                toolbar:
                    'undo redo | styles | bold italic underline strikethrough forecolor backcolor | ' +
                    'fontfamily fontsize | alignleft aligncenter alignright alignjustify | ' +
                    'bullist numlist outdent indent | link image media table | ' +
                    'charmap emoticons | code fullscreen preview | removeformat help | tableprops tablerowprops tablecellprops tabledelete',
                font_family_formats:
                    'Arial=arial,helvetica,sans-serif; Courier New=courier new,courier; ' +
                    'Georgia=georgia,palatino; Tahoma=tahoma,arial; Times New Roman=times new roman,times; ' +
                    'Verdana=verdana,geneva;',
                font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt',
                content_style:
                    'body { font-family:Arial,Helvetica,sans-serif; font-size:14px }',
                toolbar_mode: 'sliding',
                quickbars_insert_toolbar: 'image media table hr',
                quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
                contextmenu: 'link image table',
                file_picker_types: 'image',
                file_picker_callback: function (callback, value, meta) {
                    if (meta.filetype === 'image') {
                        const input = document.createElement('input');
                        input.setAttribute('type', 'file');
                        input.setAttribute('accept', 'image/*');
                        input.onchange = function () {
                            const file = this.files[0];
                            const reader = new FileReader();
                            reader.onload = function () {
                                const id = 'blobid' + new Date().getTime();
                                const blobCache = editorRef.current.editorUpload.blobCache;
                                const base64 = reader.result.split(',')[1];
                                const blobInfo = blobCache.create(id, file, base64);
                                blobCache.add(blobInfo);
                                callback(blobInfo.blobUri(), { title: file.name });
                            };
                            reader.readAsDataURL(file);
                        };
                        input.click();
                    }
                },
                automatic_uploads: true,
            }}
        />
    );
}
