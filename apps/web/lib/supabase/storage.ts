import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";

export type UploadResult = {
  success: boolean;
  message: string;
  fileId?: string;
  publicUrl?: string;
};

/**
 * Uploads a File from FormData to Supabase Storage and records metadata in the 'files' table.
 */
export async function uploadFileToStorage(
  bucketName: string,
  folderPath: string,
  file: File,
  ownerProfileId: string | null
): Promise<UploadResult> {
  if (!hasSupabaseEnv()) {
    return {
      success: true,
      message: "โหมด Demo: จำลองการอัปโหลดไฟล์สำเร็จ",
      fileId: crypto.randomUUID(),
      publicUrl: `/demo-files/${file.name}`
    };
  }

  try {
    const supabase = createAdminClient();
    
    // Generate clean storage path
    const fileExtension = file.name.split(".").pop();
    const cleanFileName = `${crypto.randomUUID()}.${fileExtension}`;
    const storagePath = `${folderPath}/${cleanFileName}`;

    // Convert file to buffer for Supabase Storage upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload file binary
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { success: false, message: `ล้มเหลวในการอัปโหลดไฟล์ไปยังสตอเรจ: ${uploadError.message}` };
    }

    // 2. Insert metadata into 'files' table
    const { data: fileRecord, error: dbError } = await supabase
      .from("files")
      .insert({
        owner_profile_id: ownerProfileId || null,
        bucket_name: bucketName,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size
      })
      .select("id")
      .single();

    if (dbError || !fileRecord) {
      console.error("Database insert error:", dbError);
      return { success: false, message: `ล้มเหลวในการบันทึกข้อมูลเมตาของไฟล์: ${dbError?.message}` };
    }

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    return {
      success: true,
      message: "อัปโหลดไฟล์สำเร็จ",
      fileId: fileRecord.id,
      publicUrl
    };
  } catch (err: any) {
    console.error("Upload handler exception:", err);
    return { success: false, message: `เกิดข้อผิดพลาดในการจัดการไฟล์: ${err?.message || err}` };
  }
}
