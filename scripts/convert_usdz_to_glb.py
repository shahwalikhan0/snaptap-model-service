import bpy
import sys
import os

def convert_usdz_to_glb(input_file, output_file):
    """Optimized USDZ → GLB conversion with Blender 4.3.2"""
    print(f"Converting: {input_file} → {output_file}")

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    # Clear scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Import USDZ with essential settings
    try:
        bpy.ops.wm.usd_import(
            filepath=input_file,
            import_meshes=True,
            import_materials=True,
            import_visible_only=True,
            read_mesh_uvs=True,
            read_mesh_colors=True,
            set_material_blend=True
        )
        print("USDZ import successful.")
    except Exception as e:
        print(f"USDZ import failed: {e}")
        sys.exit(1)

    # Export GLB with validated parameters for Blender 4.3.2
    try:
        bpy.ops.export_scene.gltf(
            filepath=output_file,
            export_format='GLB',          # Binary format
            export_yup=True,               # Y-up orientation (standard for GLB)
            export_apply=True,             # Apply transforms
            export_animations=False,       # No animations
            export_materials='EXPORT',     # Export materials
            export_cameras=False,          # No cameras
            export_lights=False,           # No lights
            export_extras=False,           # No custom properties
            export_skins=False,           # No skinning
            export_morph=False,            # No morph targets
            export_texcoords=True,         # Keep UVs
            export_normals=True,           # Keep normals
            export_tangents=False,         # No tangents (not usually needed)
            export_image_format='AUTO',    # Automatic texture format
        )
        print("GLB export successful.")
    except Exception as e:
        print(f"GLB export failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: blender -b -P convert.py -- <input.usdz> <output.glb>")
        sys.exit(1)

    input_usdz = sys.argv[-2]
    output_glb = sys.argv[-1]

    convert_usdz_to_glb(input_usdz, output_glb)
    bpy.ops.wm.quit_blender()