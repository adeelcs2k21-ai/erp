# Documentation Module Setup Guide

Follow these steps to enable file upload functionality in the Documentation module.

## Step 1: Update Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `idjounuezdqtltdzalrf`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `update-documents-table.sql`
6. Click **Run** or press `Ctrl+Enter`

You should see a success message.

## Step 2: Create Storage Bucket

1. In Supabase Dashboard, click on **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Enter the following details:
   - **Name**: `documents`
   - **Public bucket**: Toggle ON (or configure RLS policies later)
4. Click **Create bucket**

## Step 3: Configure Storage Policies (Optional but Recommended)

If you want to control who can upload/view files:

1. Click on the `documents` bucket you just created
2. Click on **Policies** tab
3. Click **New Policy**
4. Create the following policies:

### Policy 1: Allow authenticated users to upload
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');
```

### Policy 2: Allow public read access
```sql
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
```

### Policy 3: Allow authenticated users to delete their uploads
```sql
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
```

## Step 4: Verify Setup

1. Go to your ERP application
2. Navigate to **Documentation** page
3. Click **+ Add Document**
4. Try uploading a PDF or image file
5. Click **Save Document**
6. Click **View** to see the file preview

## Troubleshooting

### Issue: "Failed to upload file"
- Check that the storage bucket is created and named exactly `documents`
- Verify the bucket is public or has proper RLS policies
- Check browser console for detailed error messages

### Issue: "File not displaying"
- Ensure the bucket is public
- Check the file URL in the database (should start with your Supabase URL)
- Verify file type is supported (PDF, JPG, PNG, GIF, DOC, DOCX)

### Issue: "Permission denied"
- Check RLS policies on both `documents` table and storage bucket
- Ensure user is authenticated
- Verify Supabase service role key is correct in `.env.local`

## Supported File Types

- **PDF**: Full preview with scrolling
- **Images**: JPG, JPEG, PNG, GIF - Large preview
- **Documents**: DOC, DOCX - Download only
- **Text**: Plain text content stored in database

## File Size Limits

Default Supabase limits:
- Free tier: 1GB total storage
- Pro tier: 100GB total storage
- Max file size: 50MB per file

To increase limits, upgrade your Supabase plan.

## Security Best Practices

1. **Enable RLS**: Always enable Row Level Security on the documents table
2. **Validate file types**: The upload API only accepts specific file types
3. **Scan for malware**: Consider adding virus scanning for uploaded files
4. **Limit file sizes**: Add file size validation in the upload API
5. **Use signed URLs**: For sensitive documents, use signed URLs instead of public URLs

## Next Steps

Once setup is complete, users can:
- Upload PDF documents for company policies
- Store images of certificates, licenses, etc.
- Save Word documents for templates
- Create text-based documentation
- View all documents in a centralized location
- Edit and update documents as needed
- Delete outdated documents

## Need Help?

If you encounter issues:
1. Check Supabase logs in Dashboard → Logs
2. Check browser console for JavaScript errors
3. Verify environment variables in `.env.local`
4. Ensure Supabase project is active and not paused
