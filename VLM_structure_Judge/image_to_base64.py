import base64
import io


def pil_image_to_base64(img):
    buffered = io.BytesIO()
    img.save(buffered,format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

