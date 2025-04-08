import os
import sys

def list_subdirectories(directory):
    """
    List all immediate subdirectories in the given directory.
    
    :param directory: Path to the directory to list subdirectories from
    :return: List of subdirectory names
    """
    try:
        # Get full path and expand any user shortcuts
        full_path = os.path.abspath(os.path.expanduser(directory))
        
        # List all items in the directory
        items = os.listdir(full_path)
        
        # Filter for directories, excluding hidden directories
        subdirs = [
            item for item in items 
            if os.path.isdir(os.path.join(full_path, item)) 
            and not item.startswith('.')
        ]
        
        return subdirs
    except Exception as e:
        print(f"Error listing subdirectories: {e}")
        return []

def consolidate_typescript_files(src_directory, selected_subdir, output_file):
    """
    Consolidate contents of TypeScript files from selected directory.
    
    :param src_directory: The src directory to start searching from
    :param selected_subdir: Specific subdirectory to process (or None for entire src)
    :param output_file: Path to the output consolidated text file
    """
    try:
        # Expand the src directory to handle ~/ and relative paths
        src_directory = os.path.abspath(os.path.expanduser(src_directory))
        output_file = os.path.abspath(os.path.expanduser(output_file))
        
        # Ensure the output directory exists
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        # Determine the search path
        if selected_subdir:
            search_path = os.path.join(src_directory, selected_subdir)
        else:
            search_path = src_directory
        
        # Open the output file in write mode
        with open(output_file, 'w', encoding='utf-8') as outfile:
            # Walk through directories and subdirectories
            for dirpath, dirnames, filenames in os.walk(search_path):
                # Remove hidden directories
                dirnames[:] = [d for d in dirnames if not d.startswith('.')]
                
                for filename in filenames:
                    # Process .ts and .tsx files
                    if filename.endswith('.ts') or filename.endswith('.tsx'):
                        # Create full file path
                        file_path = os.path.join(dirpath, filename)
                        
                        try:
                            # Read file contents
                            with open(file_path, 'r', encoding='utf-8') as infile:
                                # Write a header with the file path
                                outfile.write(f"\n{'='*70}\n")
                                outfile.write(f"FILE: {file_path}\n")
                                outfile.write(f"{'='*70}\n")
                                
                                # Write file contents
                                file_contents = infile.read()
                                outfile.write(file_contents)
                                
                                # Add a newline between files
                                outfile.write("\n\n")
                        
                        except Exception as file_error:
                            # Log any file reading errors
                            outfile.write(f"\nERROR reading file {file_path}: {str(file_error)}\n")
        
        print(f"Successfully consolidated TypeScript files into {output_file}")
        
        # Count processed files
        total_files = sum(
            1 for dirpath, dirnames, filenames in os.walk(search_path) 
            for filename in filenames 
            if filename.endswith('.ts') or filename.endswith('.tsx')
        )
        print(f"Total files processed: {total_files}")
    
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        sys.exit(1)

def main():
    """
    Interactive script to consolidate TypeScript files.
    """
    # Default src directory
    SRC_DIRECTORY = "./src"
    
    # Verify src directory exists
    src_full_path = os.path.abspath(os.path.expanduser(SRC_DIRECTORY))
    if not os.path.exists(src_full_path):
        print(f"Error: Source directory {src_full_path} does not exist.")
        sys.exit(1)
    
    # List available subdirectories
    subdirs = list_subdirectories(src_full_path)
    
    # Prompt user for choice
    print("\nAvailable directories in src:")
    print("0. Process entire src directory")
    for i, subdir in enumerate(subdirs, 1):
        print(f"{i}. {subdir}")
    
    while True:
        try:
            choice = input("\nEnter the number of the directory to process (0 for entire src): ")
            choice = int(choice)
            
            if choice == 0:
                selected_subdir = None
                output_filename = "consolidated_src_files.txt"
                break
            elif 1 <= choice <= len(subdirs):
                selected_subdir = subdirs[choice-1]
                output_filename = f"consolidated_{selected_subdir}_files.txt"
                break
            else:
                print("Invalid choice. Please try again.")
        except ValueError:
            print("Please enter a valid number.")
    
    # Output file in the same directory as the script
    OUTPUT_FILE = os.path.join(os.getcwd(), output_filename)
    
    # Consolidate files
    consolidate_typescript_files(SRC_DIRECTORY, selected_subdir, OUTPUT_FILE)

if __name__ == "__main__":
    main()

# Usage instructions:
# 1. Save this script in your project root
# 2. Run in Terminal using: python script_name.py
# 3. Choose the directory to process
# 4. The consolidated file will be created in the current directory
