export class S3Service {
  async validateImageUrl(url: string): Promise<boolean> {
    // Mock S3 service for development
    return url.startsWith('http');
  }
  
  async validateDocumentUrl(url: string): Promise<boolean> {
    // Mock S3 service for development
    return url.startsWith('http');
  }
}
